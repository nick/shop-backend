require('dotenv').config()
const config = require('./config')()

const fs = require('fs')
const WebSocket = require('ws')
const openpgp = require('openpgp')
const Web3 = require('web3')
const get = require('lodash/get')
const abi = require('./_abi')
const { getIpfsHashFromBytes32, getText } = require('./_ipfs')
const netId = config.netId

const prepareDb = require('./data/_prepare')
const sendMail = require('./emailer')

const Database = require('better-sqlite3')
const dbOpt = { verbose: console.log }
const db = new Database(`${__dirname}/data/${config.network}.db`, dbOpt)

const web3 = new Web3()

const Marketplace = new web3.eth.Contract(abi)
const MarketplaceABI = Marketplace._jsonInterface
const PrivateKey = fs.readFileSync(`${__dirname}/data/private-pgp.key`)

const SubscribeToLogs = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'eth_subscribe',
  params: ['logs', { address: config.marketplace, topics: [] }]
})

const SubscribeToNewHeads = JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'eth_subscribe',
  params: ['newHeads']
})

const GetPastLogs = ({ fromBlock, toBlock }) =>
  JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'eth_getLogs',
    params: [
      {
        address: config.marketplace,
        topics: [],
        fromBlock: web3.utils.numberToHex(fromBlock),
        toBlock: web3.utils.numberToHex(toBlock)
      }
    ]
  })

let ws
function connectWS() {
  if (ws) {
    ws.removeAllListeners()
  }
  console.log('Trying to connect...')
  ws = new WebSocket(config.providerWs)

  const stmt = db.prepare('SELECT last_block FROM BlockTracker')
  let { last_block: lastBlock } = stmt.get()
  lastBlock = 5349781
  console.log(`Last recorded block: ${lastBlock}`)

  function heartbeat() {
    console.log('Got ping...')
    clearTimeout(this.pingTimeout)
    this.pingTimeout = setTimeout(() => {
      console.log('ping timeout')
      ws.terminate()
      connectWS()
    }, 30000 + 1000)
  }
  ws.heartbeat = heartbeat

  ws.on('error', err => {
    console.log('Error')
    console.error(err)
    setTimeout(() => connectWS(), 5000)
  })
  ws.on('ping', heartbeat)
  ws.on('close', function clear() {
    console.log('Connection closed')
    clearTimeout(this.pingTimeout)
  })

  ws.on('open', function open() {
    console.log('Connection open')
    this.heartbeat()
    ws.send(SubscribeToLogs)
    ws.send(SubscribeToNewHeads)
  })

  let heads, logs
  ws.on('message', function incoming(raw) {
    const data = JSON.parse(raw)
    if (data.id === 1) {
      logs = data.result
    } else if (data.id === 2) {
      heads = data.result
    } else if (data.id === 3) {
      console.log(`Got ${data.result.length} unhandled logs`)
      data.result.map(handleLog)
    } else if (get(data, 'params.subscription') === logs) {
      handleLog(data.params.result)
    } else if (get(data, 'params.subscription') === heads) {
      const number = handleNewHead(data.params.result)
      const blockDiff = number - lastBlock
      if (blockDiff > 500) {
        console.log('Too many new blocks. Skip past log fetch.')
      } else if (blockDiff > 1 && config.fetchPastLogs) {
        console.log(`Fetching ${blockDiff} past logs...`)
        ws.send(GetPastLogs({ fromBlock: lastBlock, toBlock: number }))
      }
      lastBlock = number
    } else {
      console.log('Unknown message')
    }
  })
}

const handleNewHead = head => {
  const number = web3.utils.hexToNumber(head.number)
  const timestamp = web3.utils.hexToNumber(head.timestamp)
  console.log(`New block ${number} timestamp: ${timestamp}`)

  const sql = 'UPDATE BlockTracker SET last_block = ? WHERE network_id = ?'
  db.prepare(sql).run(number, netId)

  return number
}

const handleLog = async ({ data, topics, transactionHash, blockNumber }) => {
  const eventAbi = MarketplaceABI.find(i => i.signature === topics[0])
  if (!eventAbi) {
    console.log('Unknown event')
    return
  }

  const selectTx = db.prepare(
    'SELECT transaction_hash FROM Transactions WHERE transaction_hash = ?'
  )
  const existingTx = selectTx.get(transactionHash)
  if (existingTx) {
    console.log('Already handled tx')
    return
  } else {
    const insertTx = db.prepare(`INSERT INTO Transactions
      (network_id, transaction_hash, block_number)
      VALUES(?, ?, ?)
    `)
    insertTx.run(netId, transactionHash, web3.utils.hexToNumber(blockNumber))
  }

  const { name, inputs } = eventAbi
  const decoded = web3.eth.abi.decodeLog(inputs, data, topics.slice(1))
  const { listingID, offerID, ipfsHash, party } = decoded

  console.log(`${name} - ${listingID}-${offerID} by ${party}`)
  console.log(`IPFS Hash: ${getIpfsHashFromBytes32(ipfsHash)}`)

  try {
    const offerData = await getText(config.ipfsGateway, ipfsHash, 10000)
    const offer = JSON.parse(offerData)
    console.log('Offer:', offer)

    if (!offer.encryptedData) {
      console.log('No encrypted data found')
      return
    }

    const encryptedDataJson = await getText(
      config.ipfsGateway,
      offer.encryptedData,
      10000
    )
    const encryptedData = JSON.parse(encryptedDataJson)
    console.log('Encrypted Data:', encryptedData)

    const privateKey = await openpgp.key.readArmored(PrivateKey)
    const privateKeyObj = privateKey.keys[0]
    await privateKeyObj.decrypt('abc123')

    const message = await openpgp.message.readArmored(encryptedData.data)
    const options = { message, privateKeys: [privateKeyObj] }

    const plaintext = await openpgp.decrypt(options)
    const cart = JSON.parse(plaintext.data)
    cart.offerId = `${netId}-001-${listingID}-${offerID}`
    cart.tx = transactionHash
    console.log(cart)

    sendMail(cart)
  } catch (e) {
    console.error(e)
  }
}

prepareDb(db, netId)
connectWS()

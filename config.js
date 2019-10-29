const network = process.env.NETWORK || 'localhost'
const AlchemyKey = process.env.ALCHEMY_KEY

let localContractAddress
try {
  const Addresses = require(`@origin/contracts/build/contracts.json`)
  localContractAddress = Addresses.Marketplace_V01
} catch (e) {
  /* Ignore */
}

const Configs = {
  localhost: {
    netId: 999,
    listingId: '999-001-0',
    ipfsGateway: 'http://localhost:8080',
    ipfsApi: 'http://localhost:5002',
    providerWs: 'ws://localhost:8545',
    provider: 'http://localhost:8545',
    paymentUrl: 'http://localhost:3000/pay',
    productUrl: 'http://localhost:8081/products/',
    marketplace: localContractAddress
  },
  rinkeby: {
    netId: 4,
    listingId: '4-001-1',
    ipfsGateway: 'https://ipfs.staging.originprotocol.com',
    ipfsApi: 'https://ipfs.staging.originprotocol.com',
    providerWs: `wss://eth-rinkeby.ws.alchemyapi.io/ws/${AlchemyKey}`,
    provider: `https://eth-rinkeby.alchemyapi.io/jsonrpc/${AlchemyKey}`,
    paymentUrl: 'https://tst5.nick9.now.sh/api/test',
    productUrl: 'https://data.ethswag.com/products/',
    marketplace: '0x3d608cce08819351ada81fc1550841ebc10686fd',
    fetchPastLogs: true
  },
  mainnet: {
    netId: 1,
    listingId: '1-001-1',
    ipfsGateway: 'https://ipfs.originprotocol.com',
    ipfsApi: 'https://ipfs.originprotocol.com',
    providerWs: `wss://eth-mainnet.ws.alchemyapi.io/ws/${AlchemyKey}`,
    provider: `https://eth-mainnet.alchemyapi.io/jsonrpc/${AlchemyKey}`,
    paymentUrl: '',
    productUrl: '',
    marketplace: '0x698ff47b84837d3971118a369c570172ee7e54c2',
    fetchPastLogs: true
  }
}

module.exports = function() {
  if (!Configs[network]) {
    process.exit(`No config for network ${network}`)
  }

  return { ...Configs[network], network }
}

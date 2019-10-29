const mjml2html = require('mjml')
const nodemailer = require('nodemailer')
const cartData = require('./cartData')
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

const head = require('./templates/head')
const email = require('./templates/email')
const emailTxt = require('./templates/emailTxt')
const orderItem = require('./templates/orderItem')
const orderItemTxt = require('./templates/orderItemTxt')

function formatPrice(num) {
  return `$${(num / 100).toFixed(2)}`
}

const prefix = process.env.EMAIL_ASSET_PREFIX

async function sendMail(cart) {
  const items = await cartData(cart.items)

  const orderItems = items.map(item => {
    const img = item.variant.image || item.product.image
    return orderItem({
      img: `${prefix}/${item.product.id}/520/${img}`,
      title: item.product.title,
      quantity: item.quantity,
      price: formatPrice(item.price)
    })
  })
  const orderItemsTxt = items.map(item => {
    return orderItemTxt({
      title: item.product.title,
      quantity: item.quantity,
      price: formatPrice(item.price)
    })
  })

  const vars = {
    head,
    siteName: 'Ethporeum',
    supportEmailName: 'Ethereum Swag Store',
    supportEmail: 'help@ethswag.com',
    subject: '🦄🌈 Your Ethereum Swag!',
    storeUrl: 'https://www.ethswag.com',

    orderNumber: cart.offerId,
    firstName: cart.userInfo.firstName,
    lastName: cart.userInfo.lastName,
    email: cart.userInfo.email,
    orderUrl: `https://www.ethswag.com/#/order/${cart.tx}?auth=${cart.dataKey}`,
    orderItems,
    orderItemsTxt,
    subTotal: formatPrice(cart.subTotal),
    shipping: formatPrice(cart.shipping.amount),
    total: formatPrice(cart.total),
    shippingAddress: [
      `${cart.userInfo.firstName} ${cart.userInfo.lastName}`,
      `${cart.userInfo.address1}`,
      `${cart.userInfo.city} ${cart.userInfo.province} ${cart.userInfo.zip}`,
      `${cart.userInfo.country}`
    ],
    billingAddress: [
      `${cart.userInfo.firstName} ${cart.userInfo.lastName}`,
      `${cart.userInfo.address1}`,
      `${cart.userInfo.city} ${cart.userInfo.province} ${cart.userInfo.zip}`,
      `${cart.userInfo.country}`
    ],
    shippingMethod: cart.shipping.label,
    paymentMethod: cart.paymentMethod.label
  }

  const htmlOutput = mjml2html(email(vars), { minify: true })
  const txtOutput = emailTxt(vars)

  const message = {
    from: `${vars.supportEmailName} <${vars.supportEmail}>`,
    to: `${vars.firstName} ${vars.lastName} <${vars.email}>`,
    subject: vars.subject,
    html: htmlOutput.html,
    text: txtOutput
  }
  // console.log(message)

  transporter.sendMail(message, (err, msg) => {
    if (err) {
      console.log(err)
    } else {
      console.log(msg)
    }
  })
}

module.exports = sendMail

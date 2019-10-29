module.exports = () => `
<mj-head>
  <mj-attributes>
    <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="16px" line-height="1.25em" color="#333" />
    <mj-divider border-width="1px" border-color="lightgrey" />
    <mj-class name="light" color="#777" />
    <mj-class name="xlarge" font-size="30px" />
    <mj-class name="large" font-size="24px" />
    <mj-class name="medium" font-size="20px" />
    <mj-class name="small" font-size="14px" />
  </mj-attributes>
  <mj-style inline="inline">
    a {
      color: #1990c6 !important;
      text-decoration: none;
    }
    .btn {
      background-color: #1990c6;
      color: #ffffff !important;
      text-decoration: none;
      display: inline-block;
      padding: 25px 30px;
      border-radius: 5px;
      margin-right: 16px;
    }

    .item-row {
      font-weight: bold;
    }

    .item-row .image {
      width: 90px;
    }

    .item-row .image img {
      width: 70px;
      border-radius: 10px;
    }

    .item-row .title {
      text-align: left;
    }

    .item-row .price {
      text-align: right;
    }

    .cart-summary td {
      padding: 0 0 20px 0;
    }

    .cart-summary .label {
      color: #777;
    }

    .cart-summary .price {
      font-weight: bold;
      text-align: right;
    }

    .cart-summary .price .large {
      font-size: 24px;
    }

    .cart-summary.total td {
      border-top: 2px solid lightgrey;
      padding-top: 20px;
    }
    @media (max-width: 600px) {
    }
  </mj-style>
</mj-head>
`

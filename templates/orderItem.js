module.exports = vars => `
<tr class="item-row">
  <td class="image">
    <img src="${vars.img}" />
  </td>
  <td class="title">${vars.title} × ${vars.quantity}</td>
  <td class="price">${vars.price}</td>
</tr>
`

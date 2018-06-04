const socket = io.connect(`${window.location.hostname}:${3000}`);

let store = {};

function refreshPage() {
  let total = 0;
  // reset the list
  $('#list-item').empty();
  $('#list-item').append(`
    <li class="row list-inline columnCaptions">
    <span>QTY</span>
    <span>ITEM</span>
    <span>Price</span>
  </li>`);
  // iterate through object
  Object.entries(store).forEach(([, value])=> {
    if (value.qty > 0) {
      total += value.price * value.qty;
      $('#list-item').append(`<li class="row">
        <span class="quantity">${value.qty}</span>
        <span class="itemName">${value.name}</span>
        <span class="popbtn"><a class="arrow"></a></span>
        <span class="price">Rp. ${value.price}</span>
      </li>`);
    }
  });
  // change the total
  $('#list-item').append(`
    <li class="row totals">
    <span class="itemName">Total:</span>
    <span class="price" id="total-text">Rp. ${total}</span>
    <span class="order"> <a class="text-center">ORDER</a></span>
  </li>`);
}

socket.on('data', (data) => {
  store = data;
  refreshPage();
});

socket.on('connect', () => {
  socket.emit('join', 'Client is connected!');
  refreshPage();
});

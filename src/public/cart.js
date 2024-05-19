const payBtn = document.querySelector(".btn-buy");

payBtn.addEventListener("click", () => {
  fetch("/stripe-checkout", {
    method: "post",
    headers: new Headers({ "Content-Type": "application/Json" }),
    body: JSON.stringify({
      items: JSON.parse(localStorage.getItem("cartItems")),
    }),
  })
    .then((res) => res.json())
    .then((url) => {
      location.href = url;

    })
    .catch((err) => console.log(err));
});

// Botón de PayPal

// const payBtnPayPal = document.querySelector(".btn-buy-paypal");

// payBtnPayPal.addEventListener("click", () => {
//   fetch("/paypal-checkout", {
//     method: "post",
//     headers: new Headers({ "Content-Type": "application/Json" }),
//     body: JSON.stringify({
//       items: JSON.parse(localStorage.getItem("cartItems")),
//     }),
//   })
//     .then((res) => res.json())
//     .then((data) => {
//       location.href = data.url;
//     })
//     .catch((err) => console.log(err));
// });
// Botón de MercadoPago
/* const payBtnMercadoPago = document.querySelector(".btn-buy-mercadopago");

payBtnMercadoPago.addEventListener("click", () => {
  fetch("/mercadopago-checkout", {
    method: "post",
    headers: new Headers({ "Content-Type": "application/Json" }),
    body: JSON.stringify({
      items: JSON.parse(localStorage.getItem("cartItems")),
    }),
  })
    .then((res) => res.json())
    .then((url) => {
      location.href = url;
      clearCart();
    })
    .catch((err) => console.log(err));
});
 */
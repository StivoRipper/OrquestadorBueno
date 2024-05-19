const axios = require("axios");
const Stripe = require("stripe");
const mercadopago = require("mercadopago");
const cors = require("cors");
const stripe = new Stripe(
  "sk_test_51O6QsWJGdC53RqzMKrr5WmubTo6oAGEk05LQN2PgQRZCne8XDI1FpeWbhApsHkEG2MgCHRpEuvPxPpaPUmlnakrX00mgHBPWpo"
);
//----------------------------------------------- Stripe ----------------------------------------------------
const createSession = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          product_data: {
            name: "Laptop Gamer",
            description: "Consola",
          },
          unit_amount: 80,
          currency: "USD",
        },
        quantity: 1,
      },
      
    ],
    mode: "payment",
    success_url: "http://localhost:4000/succes",
    cancel_url: "http://localhost:4000/cancel.html",
  });
  return res.json(session);
};
//-----------------------------------------------------------------------PAY PAL -------------------------------------------------------------

const PAY_PAL_C =
  "Ab7FA1ndpItrTMH4iSnpiAfxssFkLKM5-T88H61XWY37npvF2aBiWB8nHjvK_9Rw1YpuYu9uJdtjFd7c";
const PAY_PAL_S =
  "EBj-hesgdF_q9YFDRkZ1xnuO3eLN9WjycLOYoWI7ffpbbfVvf3AbKk_x67KlUncikbXz-i-7IikPcS5v";

const PAYPAL_API = "https://api.sandbox.paypal.com";

const createOrder = async (req, res) => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const tokenResponse = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    params,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: PAY_PAL_C,
        password: PAY_PAL_S,
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        items: [
          {
            name: "T-Shirt",
            description: "Green XL",
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: "10.00",
            },
          },
        ],
        amount: {
          currency_code: "USD",
          value: "10.00",
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: "10.00",
            },
          },
        },
      },
    ],
    application_context: {
      return_url: `http://localhost:4000/capture-order`,
      cancel_url: "http://localhost:4000/cancel-payment",
    },
  };

  const orderResponse = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders`,
    order,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.json(orderResponse.data);
};

const captureOrder = async (req, res) => {
  const { token } = req.query;
  const response = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
    {},
    {
      auth: {
        username: PAY_PAL_C,
        password: PAY_PAL_S,
      },
    }
  );
  console.log(response.data);
  return res.redirect("/payed.html");
};
const cancelPayment = (req, res) => res.redirect("/");
//-----------------------------------------------------Mercado Pago ----------------------------------------------------------
const PORT = 4000;
const HOST = "http://localhost: " + PORT;
const createOrderMP = async (req, res) => {
  mercadopago.configure({
    access_token:
      "TEST-1722260840556788-112900-6bbb3ad240aad86127b2b90617f90321-1545343380",
  });

  const result = await mercadopago.preferences.create({
    items: [
      {
        title: "Laptop Lenovo",
        unit_price: 500,
        currency_id: "MXN",
        quantity: 1,
      },
    ],
    back_urls: {
      success: "http://localhost:4000",
      failure: "http://localhost:4000",
      pending: "http://localhost:4000",
    },
    notification_url:
      "https://6fa2-2806-106e-5-917e-2cdc-c1ae-414d-551a.ngrok.io/webhook",
  });

  console.log(result);

  res.send(result.body);
};

const receiveWebhook = async (req, res) => {
  console.log(req.query);
  const payment = req.query;

  try {
    if (payment.type == "payment") {
      const data = await mercadopago.payment.findById(payment["data.id"]);
      console.log(data);
    }

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500).json({ error: error.message });
  }
};

module.exports = {
  createSession,
  createOrder,
  cancelPayment,
  captureOrder,
  receiveWebhook,
  createOrderMP,
};

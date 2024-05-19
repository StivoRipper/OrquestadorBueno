const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51O6QsWJGdC53RqzMKrr5WmubTo6oAGEk05LQN2PgQRZCne8XDI1FpeWbhApsHkEG2MgCHRpEuvPxPpaPUmlnakrX00mgHBPWpo"
); // Add your Secret Key Here
const mercadopago = require("mercadopago");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(express.static(path.resolve("src/public")));

app.post("/stripe-checkout", async (req, res) => {
  const lineItems = req.body.items.map((item) => {
    const unitAmount = Math.round(
      parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * 100
    );
    console.log("item-price", item.price);
    console.log("unitAmount:", unitAmount);
    return {
      price_data: {
        currency: "MXN",
        product_data: {
          name: item.title,
          images: [item.productImg],
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });
  console.log("lineItems:", lineItems);

  // crear checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: "http://localhost:4000/succes",
    cancel_url: "http://localhost:4000/cancel.html",
    line_items: lineItems,
    //preguntar direccion en Stripe checkout page
  });
  res.json(session.url);
  console.log("lineItems:", lineItems);
});

const PAY_PAL_C =
  "Ab7FA1ndpItrTMH4iSnpiAfxssFkLKM5-T88H61XWY37npvF2aBiWB8nHjvK_9Rw1YpuYu9uJdtjFd7c";
const PAY_PAL_S =
  "EBj-hesgdF_q9YFDRkZ1xnuO3eLN9WjycLOYoWI7ffpbbfVvf3AbKk_x67KlUncikbXz-i-7IikPcS5v";

const PAYPAL_API = "https://api.sandbox.paypal.com";

const getClientCredentials = async () => {
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
  return tokenResponse.data.access_token;
};

app.post("/paypal-checkout", async (req, res) => {
  try {
    const accessToken = await getClientCredentials();

    const total = req.body.items.reduce(
      (total, item) =>
        total +
        parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity,
      0
    );

    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          items: req.body.items.map((item) => {
            const unitAmount = Math.round(
              parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * 100
            );
            return {
              name: item.title,
              quantity: item.quantity.toString(),
              unit_amount: {
                currency_code: "MXN",
                value: (unitAmount / 100).toFixed(2),
              },
            };
          }),
          amount: {
            currency_code: "MXN",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "MXN",
                value: total.toFixed(2),
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

    const approveLink = orderResponse.data.links.find(
      (link) => link.rel === "approve"
    );

    return res.json({ url: approveLink.href });
  } catch (error) {
    console.error("Error creating PayPal order", error);
    return res.status(500).send("Failed to create PayPal order");
  }
});
//----------------------------------------------------------------------------Mercado Pago ------------------------------------------------------------//
mercadopago.configure({
  access_token:
    "TEST-1567338789016917-102921-70531cc6c0e43143b1e79d88a6be3ed6-1529720876",
});
app.post("/mercadopago-checkout-pro", async (req, res) => {
  let preference = {
    items: req.body.items.map((item) => {
      return {
        title: item.title,
        unit_price: parseFloat(item.price.replace(/[^0-9.-]+/g, "")),
        quantity: Math.round(item.quantity),
      };
    }),
    back_urls: {
      success: "http://localhost:4000/payed.html",
      failure: "http://localhost:4000/cancel.html",
      pending: "http://localhost:4000/payed.html",
    },
    auto_return: "approved",
    notification_url:
      "https://83d1-2806-106e-5-7a77-a110-eb55-6840-f10d.ngrok-free.app/webhook",
  };

  try {
    let preferenceResult = await mercadopago.preferences.create(preference);

    console.log(preferenceResult); // Imprime el resultado
    res.redirect(preferenceResult.body.init_point); // Redirige al usuario al entorno de pruebas de MercadoPago
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.post("/webhook", async function (req, res) {
  const paymentId = req.query.id;

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mercadopago.configure.access_token}`,
          port: 4000,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error: ", error);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("Server is running..."));

const { Router } = require("express");
const router = Router();

const {createOrder} = require ("../controllers/payment.controller.js")
const {captureOrder} = require ("../controllers/payment.controller.js")
const {cancelPayment} = require ("../controllers/payment.controller.js")
const { createSession } = require("../controllers/payment.controller.js")
const { createOrderMP } = require("../controllers/payment.controller.js")
const { receiveWebhook } = require("../controllers/payment.controller.js")




router.post("/create-checkout-session", createSession);
router.get("/succes", (req, res) => res.redirect("/payed.html"));
router.get("/cancel", (req, res) => res.redirect("/"));

router.post("/create-order", createOrder);
router.get("/capture-order", captureOrder);
router.get("/cancel-payment", cancelPayment);

router.post("/create-order-mp", createOrderMP);
router.get("/success-mp", (req, res) => res.redirect("success-mp"));
router.get("/failure", (req, res) => res.redirect("failure"));
router.get("/pending", (req, res) => res.send("pending"));
router.post("/webhook", receiveWebhook);

module.exports = router;

const { Router } = require("express");
const router = Router();

router.get("/create-order", (req, res) => res.send("creating order"));
router.get("/success", (req, res) => res.send("success-mp"));
router.get("/webhook", (req, res) => res.send("webhook"));

module.exports = router;

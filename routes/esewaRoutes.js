// routes/esewaRoutes.js
const express = require("express");
const generateEsewaSignature = require("../utils/esewa");
const { v4: uuidv4 } = require("uuid"); // modern way
// for unique transaction ID

const router = express.Router();

router.post("/create-payment", (req, res) => {
  try {
    const { total_amount } = req.body;

    if (!total_amount) {
      return res.status(400).json({ message: "total_amount is required" });
    }

    // Generate a unique transaction UUID
    const transaction_uuid = uuidv4();

    // Generate HMAC signature
    const signature = generateEsewaSignature(total_amount, transaction_uuid);

    // Send form data back to frontend
    res.json({
      payment_url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      form_data: {
        amount: total_amount,
        tax_amount: "0",
        total_amount: total_amount,
        transaction_uuid,
        product_code: "EPAYTEST",
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: "http://localhost:3000/payment/success",
        failure_url: "http://localhost:3000/payment/failure",
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating eSewa payment" });
  }
});

module.exports = router;

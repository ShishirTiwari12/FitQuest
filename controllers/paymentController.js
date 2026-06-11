// controllers/paymentController.js
const axios = require("axios");
const Order = require("../models/Order");

exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { amt, pid, refId } = req.query; // eSewa sends these as query params

    if (!amt || !pid || !refId) {
      return res.status(400).send("Missing payment verification data");
    }

    // Find order by pid (unique order ID we generated earlier)
    const order = await Order.findOne({ _id: pid });
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // eSewa verification endpoint (sandbox / production)
    const verifyUrl = "https://esewa.com.np/epay/transrec"; // production
    // const verifyUrl = "https://esewa.com.np/epay/transrec"; // sandbox same

    const params = new URLSearchParams();
    params.append("amt", amt);
    params.append("scd", "YOUR_ES_EWA_MERCHANT_CODE"); // Replace with your eSewa merchant code
    params.append("rid", refId);
    params.append("pid", pid);

    const response = await axios.post(verifyUrl, params);

    if (response.data.includes("Success")) {
      // Payment verified
      order.status = "success";
      order.esewaRef = refId;
      await order.save();

      return res.redirect("/payment/success"); // frontend success page
    } else {
      order.status = "failed";
      await order.save();
      return res.redirect("/payment/failure"); // frontend failure page
    }
  } catch (err) {
    console.error("eSewa payment verification error:", err);
    return res.redirect("/payment/failure");
  }
};

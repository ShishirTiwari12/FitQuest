const express = require("express");
const app = express();
require("dotenv").config();
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const protectRoutes = require("./middlewares/protectRoutes");

const generateFitnessPlanRoutes = require("./routes/generateFitnessPlanRoute");
const userInputRoutes = require("./routes/userInputRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const moderationRoutes = require("./routes/moderationRoutes");
const communityRoutes = require("./routes/communityRoutes");
const path = require("path");
const expertRoutes = require("./routes/expertRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const sessionPaymentRoutes = require("./routes/sessionPaymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const expertAuthRoutes = require("./routes/expertAuthRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const port = 3000;
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/plan", protectRoutes, generateFitnessPlanRoutes);
app.use("/api/user-input", protectRoutes, userInputRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", protectRoutes, cartRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/user-stats", require("./routes/userStatsRoutes.js"));
app.use("/api/challenges", challengeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/orders", require("./routes/orderRoutes.js"));
app.use("/api/esewa", require("./routes/esewaRoutes.js"));
app.use("/api/community", communityRoutes);

app.use("/api/experts", expertRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/expert-dashboard", expertAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/session-payment", sessionPaymentRoutes);
app.use("/api/admin/products", adminProductRoutes);

app.use(express.static(path.join(__dirname, "dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

async function run() {
  try {
    console.log("Database connecting.......");
    await connectDb(process.env.MONGO_URI);
    console.log("Database connected succesfully");
    app.listen(port, () => {
      console.log("server is listening at port 3000");
    });
  } catch (err) {
    console.log(err.message);
  }
}

run();
module.exports = port;

//to do for later
// add rate limit using  express-rate-limit

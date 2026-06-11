const mongoose = require("mongoose");

async function connectDb(uri) {
  try {
    await mongoose.connect(uri);
  } catch (err) {
    console.error("Database connection error:", err.message);
    throw err; // 🔥 THIS IS THE KEY
  }
}

module.exports = connectDb;

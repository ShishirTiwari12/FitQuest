const {
  getProducts,
  getSingleProduct,
} = require("../controllers/productController");
const express = require("express");
const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getSingleProduct);
module.exports = router;

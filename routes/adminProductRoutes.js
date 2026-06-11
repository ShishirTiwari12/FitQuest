// routes/adminProductRoutes.js
const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/upload");
const Product = require("../models/Product");
const protectAdmin = require("../middlewares/protectAdmin").protectAdmin;

// ── GET /api/admin/products ────────────────────────────────────────────────────
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") query.category = category;
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products." });
  }
});

// ── POST /api/admin/products ───────────────────────────────────────────────────
router.post("/", protectAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price, inStock } = req.body;
    if (!name || !description || !category || !price)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Product image is required." });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "fitquest/products", resource_type: "image" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          },
        )
        .end(req.file.buffer);
    });

    const product = await Product.create({
      name,
      description,
      category,
      price: parseFloat(price),
      inStock: parseInt(inStock) || 0,
      image: result.secure_url,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Create product error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create product." });
  }
});

// ── PUT /api/admin/products/:id ────────────────────────────────────────────────
router.put("/:id", protectAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price, inStock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "fitquest/products", resource_type: "image" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            },
          )
          .end(req.file.buffer);
      });
      product.image = result.secure_url;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) product.price = parseFloat(price);
    if (inStock !== undefined) product.inStock = parseInt(inStock);

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error("Update product error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product." });
  }
});

// ── DELETE /api/admin/products/:id ─────────────────────────────────────────────
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product." });
  }
});

module.exports = router;

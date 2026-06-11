const Product = require("../models/Product");

const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getProducts, getSingleProduct };

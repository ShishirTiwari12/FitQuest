const jwt = require("jsonwebtoken");
require("dotenv").config();

// Updated to use EXPERT_TOKEN_SECRET_KEY exclusively
const protectExpert = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized.", successful: false });

  try {
    const decoded = jwt.verify(token, process.env.EXPERT_TOKEN_SECRET_KEY);
    req.expert = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "Token expired.", successful: false });
    return res
      .status(401)
      .json({ message: "Invalid token.", successful: false });
  }
};

module.exports = protectExpert;

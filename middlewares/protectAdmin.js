const jwt = require("jsonwebtoken");
require("dotenv").config();

const protectAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Unauthorized.", successful: false });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET_KEY);
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
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

// Extra layer: only superadmins can access certain routes
const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== "superadmin")
    return res.status(403).json({ message: "Superadmin access required." });
  next();
};

module.exports = { protectAdmin, requireSuperAdmin };

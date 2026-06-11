const jwt = require("jsonwebtoken");
require("dotenv").config();

const protectRoutes = (req, res, next) => {
  console.log("reached");
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  // if (!token) return res.redirect("/api/auth/signin");
  if (!token)
    return res.status(400).json({ message: "unauthorized", successful: false });
  try {
    console.log("user is authorized");
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      // isModerator: true,
    };
    console.log(req.user);

    next();
  } catch (err) {
    console.log("err : " + err.message);
    if (err.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "token expired", successful: false });
    return res
      .status(401)
      .json({ message: "invalid token", successful: false });
  }
};

module.exports = protectRoutes;

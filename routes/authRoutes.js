const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  refreshTokenController,
  logout,
  verifyToken,
  resendVerification,
  forgotPassword,
  changePassword,
  getPublicProfile,
} = require("../controllers/auth");

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", logout);
router.get("/verify/:token", verifyToken);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/change-password/:token", changePassword);
router.get("/:username", getPublicProfile);

module.exports = router;

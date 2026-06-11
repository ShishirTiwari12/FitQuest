const express = require("express");
const router = express.Router();
const protectRoutes = require("../middlewares/protectRoutes");
const { completeChallenge } = require("../controllers/challengeController");
const upload = require("../middlewares/upload");

router.post(
  "/complete",
  protectRoutes,
  upload.single("photo"),
  completeChallenge,
);

module.exports = router;

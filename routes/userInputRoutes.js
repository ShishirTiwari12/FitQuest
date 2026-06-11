const {
  createUserInput,
  viewUserInput,
  updateUserInput,
  deleteUserInput,
} = require("../controllers/userInput");

const express = require("express");
const router = express.Router();

router.post("/create", createUserInput);
router.post("/view", viewUserInput);
router.post("/update", updateUserInput);
router.post("/delete", deleteUserInput);

module.exports = router;

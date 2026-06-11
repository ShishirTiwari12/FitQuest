const express = require("express");
const router = express.Router();
const {
  generatePlan,
  viewPlan,
  deletePlan,
} = require("../controllers/generatePlan");

router.post("/generate-plan", generatePlan);
router.get("/view-plan", viewPlan);
router.delete("/delete-plan", deletePlan); // NEW

module.exports = router;

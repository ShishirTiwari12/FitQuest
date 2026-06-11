const express = require("express");
const router = express.Router();
const { expertLogin } = require("../controllers/expertAuthController");
const protectExpert = require("../middlewares/protectExpert");
const {
  getExpertSessions,
  submitZoomLink,
  addMySlots,
  deleteMySlot,
  getMySlots,
} = require("../controllers/expertController");

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/login", expertLogin);

// ─── Sessions (protected) ─────────────────────────────────────────────────────
router.get("/sessions", protectExpert, getExpertSessions);
router.patch("/sessions/:id/zoom", protectExpert, submitZoomLink);

// ─── Slot Management (protected) ──────────────────────────────────────────────
router.get("/slots", protectExpert, getMySlots);
router.post("/slots", protectExpert, addMySlots);
router.delete("/slots/:slotId", protectExpert, deleteMySlot);

module.exports = router;

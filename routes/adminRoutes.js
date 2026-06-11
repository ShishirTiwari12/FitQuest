const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  protectAdmin,
  requireSuperAdmin,
} = require("../middlewares/protectAdmin");
const {
  adminLogin,
  createAdmin,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllExperts,
  createExpert,
  updateExpert,
  deleteExpert,
  addExpertSlots,
  getExpertSlots,
  deleteExpertSlot,
  getDashboardStats,
} = require("../controllers/adminController");

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/auth/login", adminLogin);
router.post("/auth/create-admin", protectAdmin, requireSuperAdmin, createAdmin);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats", protectAdmin, getDashboardStats);

// ─── User Management ──────────────────────────────────────────────────────────
router.get("/users", protectAdmin, getAllUsers);
router.patch("/users/:id/status", protectAdmin, updateUserStatus);
router.delete("/users/:id", protectAdmin, requireSuperAdmin, deleteUser);

// ─── Expert Management ────────────────────────────────────────────────────────
router.get("/experts", protectAdmin, getAllExperts);
router.post("/experts", protectAdmin, upload.single("photo"), createExpert);
router.patch("/experts/:id", protectAdmin, updateExpert);
router.delete("/experts/:id", protectAdmin, requireSuperAdmin, deleteExpert);

// ─── Slot Management ──────────────────────────────────────────────────────────
router.get("/experts/:id/slots", protectAdmin, getExpertSlots);
router.post("/experts/:id/slots", protectAdmin, addExpertSlots);
router.delete("/experts/:id/slots/:slotId", protectAdmin, deleteExpertSlot);

module.exports = router;

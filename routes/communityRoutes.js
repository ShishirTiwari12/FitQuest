const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const protectRoutes = require("../middlewares/protectRoutes"); // your existing auth middleware
const {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  toggleLike,
  toggleDislike,
  addComment,
  deleteComment,
} = require("../controllers/communityController");

// ─── Posts ────────────────────────────────────────────────────────────────────
router.post("/posts", protectRoutes, upload.single("image"), createPost);
router.get("/posts", protectRoutes, getAllPosts);
router.get("/posts/:id", protectRoutes, getPostById);
router.delete("/posts/:id", protectRoutes, deletePost);

// ─── Likes & Dislikes ─────────────────────────────────────────────────────────
router.post("/posts/:id/like", protectRoutes, toggleLike);
router.post("/posts/:id/dislike", protectRoutes, toggleDislike);

// ─── Comments ─────────────────────────────────────────────────────────────────
router.post("/posts/:id/comments", protectRoutes, addComment);
router.delete("/comments/:id", protectRoutes, deleteComment);

module.exports = router;

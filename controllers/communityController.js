const Post = require("../models/Post");
const Comment = require("../models/Comment");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Helper: upload buffer to Cloudinary via stream
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "fitquest/community" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── POST CRUD ────────────────────────────────────────────────────────────────

// POST /api/community/posts
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Post content is required." });
    }

    let image = { url: null, publicId: null };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image.url = result.secure_url;
      image.publicId = result.public_id;
    }

    const post = await Post.create({
      author: req.user.id,
      content: content.trim(),
      image,
    });

    await post.populate("author", "username");

    res.status(201).json({ message: "Post created successfully.", post });
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Server error while creating post." });
  }
};

// GET /api/community/posts
exports.getAllPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username")
        .populate({
          path: "comments",
          options: { sort: { createdAt: -1 }, limit: 3 },
          populate: { path: "author", select: "username" },
        }),
      Post.countDocuments(),
    ]);

    res.json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getAllPosts error:", err);
    res.status(500).json({ message: "Server error while fetching posts." });
  }
};

// GET /api/community/posts/:id
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "username" },
      });

    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json({ post });
  } catch (err) {
    console.error("getPostById error:", err);
    res.status(500).json({ message: "Server error while fetching post." });
  }
};

// DELETE /api/community/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found." });

    if (post.author.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post." });
    }

    // Remove image from Cloudinary if it exists
    if (post.image?.publicId) {
      await cloudinary.uploader.destroy(post.image.publicId);
    }

    // Remove all comments belonging to this post
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Server error while deleting post." });
  }
};

// ─── LIKES & DISLIKES ─────────────────────────────────────────────────────────

// POST /api/community/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const userId = req.user.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes.pull(userId);
    } else {
      // Like and remove dislike if present
      post.likes.push(userId);
      post.dislikes.pull(userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Like removed." : "Post liked.",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ message: "Server error while toggling like." });
  }
};

// POST /api/community/posts/:id/dislike
exports.toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const userId = req.user.id;
    const alreadyDisliked = post.dislikes.includes(userId);

    if (alreadyDisliked) {
      // Remove dislike
      post.dislikes.pull(userId);
    } else {
      // Dislike and remove like if present
      post.dislikes.push(userId);
      post.likes.pull(userId);
    }

    await post.save();

    res.json({
      message: alreadyDisliked ? "Dislike removed." : "Post disliked.",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (err) {
    console.error("toggleDislike error:", err);
    res.status(500).json({ message: "Server error while toggling dislike." });
  }
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

// POST /api/community/posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required." });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      content: content.trim(),
    });

    post.comments.push(comment._id);
    await post.save();

    await comment.populate("author", "username");

    res.status(201).json({ message: "Comment added.", comment });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ message: "Server error while adding comment." });
  }
};

// DELETE /api/community/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Comment not found." });

    if (comment.author.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment." });
    }

    // Remove reference from the parent post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.json({ message: "Comment deleted successfully." });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ message: "Server error while deleting comment." });
  }
};

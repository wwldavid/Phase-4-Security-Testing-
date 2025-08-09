// routes/comment.js
import express from "express";
import validateJWT from "../middleware/validateToken.js";
import Comment from "../models/Comment.js";
import sanitizeHtml from "sanitize-html";
import rateLimit from "express-rate-limit";

const commentRouter = express.Router();

// 统一鉴权：确保 req.user 可用
commentRouter.use(validateJWT);

const commentLimiter = rateLimit({ windowMs: 60_000, max: 30 });

// 发表评论（修复点）
commentRouter.post("/", commentLimiter, async (req, res) => {
  try {
    // 只接收 commenttxt；忽略 body.username
    const { commenttxt } = req.body || {};
    if (typeof commenttxt !== "string") {
      return res.status(400).json({ message: "Invalid comment" });
    }

    const trimmed = commenttxt.trim();
    if (!trimmed || trimmed.length > 500) {
      return res.status(400).json({ message: "Comment length invalid" });
    }

    // ✅ 关键：净化，去掉所有标签（最安全）
    const clean = sanitizeHtml(trimmed, {
      allowedTags: [],
      allowedAttributes: {},
    });

    if (!clean) {
      return res
        .status(400)
        .json({ message: "Comment contains no valid content" });
    }

    const newComment = new Comment({
      user: req.user.username, // ✅ 来自 JWT，防伪造
      text: clean, // ✅ 存净化后的内容
      // department: req.user.department, // 如你的模型有此字段再打开
      createdAt: new Date(),
    });

    await newComment.save();

    return res.status(201).json({
      message: "comment saved",
      comment: {
        user: newComment.user,
        text: newComment.text,
        id: newComment._id,
        createdAt: newComment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error while saving comment", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 获取评论列表（保持不变即可；我们已存的是净化后的 text）
commentRouter.get("/", async (req, res) => {
  try {
    const comments = await Comment.find({}).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ comment_list: comments });
  } catch (error) {
    console.error("error while getting comments", error);
    return res.status(500).json({ message: "internal server error" });
  }
});

export default commentRouter;

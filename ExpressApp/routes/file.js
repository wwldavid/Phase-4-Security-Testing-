// routes/file.js
import express from "express";
import multer from "multer";
import extractUserInfo from "../middleware/extractUserInfo.js";
import File from "../models/File.js";
import canAccessFile from "../middleware/authorization.js";

import fileType from "file-type";
const { fromBuffer } = fileType;
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

router.use(extractUserInfo);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allow = new Set([
      "image/png",
      "image/jpeg",
      "application/pdf",
      "text/plain", // 测试用，生产可移除
    ]);
    if (!allow.has(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

const safeDisplayName = (s) => (s || "file").replace(/[^a-zA-Z0-9._\- ]/g, "_");

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    let ft;
    try {
      ft = await fromBuffer(req.file.buffer);
    } catch {
      return res.status(400).json({ message: "Invalid or unreadable file" });
    }

    const allowExt = new Set(["png", "jpg", "jpeg", "pdf", "txt"]);
    if (!ft || !allowExt.has(ft.ext)) {
      return res.status(400).json({ message: "File content type not allowed" });
    }

    const diskName = `${uuidv4()}.${ft.ext}`;
    const uploadDir = path.resolve(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, diskName), req.file.buffer);

    const fileDoc = new File({
      filename: safeDisplayName(req.file.originalname),
      path: `uploads/${diskName}`,
      uploadedBy: req.user.username,
      department: req.user.department,
    });
    await fileDoc.save();

    return res.status(201).json({ message: "file uploaded", file: fileDoc });
  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /file/:id 下载
router.get("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "not found" });

    if (!canAccessFile(req.user, file)) {
      return res.status(403).json({ message: "access denied" });
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.type("application/octet-stream");

    const absPath = path.resolve(process.cwd(), file.path);
    return res.sendFile(absPath);
  } catch (err) {
    console.error("[DOWNLOAD ERROR]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /file 列表
router.get("/", async (req, res) => {
  try {
    let files;
    if (req.user.role === "admin") {
      files = await File.find({});
    } else {
      files = await File.find({ department: req.user.department });
    }
    return res.status(200).json({ files_data: files ?? [] });
  } catch (err) {
    console.error("[LIST ERROR]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

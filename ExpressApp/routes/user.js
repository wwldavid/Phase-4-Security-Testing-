import express from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const userRouter = express.Router();

// 小工具
const isJson = (req) => req.is("application/json");
const clean = (v, max = 100) =>
  typeof v === "string" ? v.trim().slice(0, max) : null;
const hasIllegalChars = (s) => /[<>$]/.test(s); // 阻止 < > $（常见 XSS/NoSQL 操作符）

// ---------- Register ----------
userRouter.post("/register", async (req, res, next) => {
  try {
    if (!isJson(req)) {
      return res
        .status(415)
        .json({ message: "Unsupported Media Type: use application/json" });
    }

    const { name, username, password, role, department } = req.body || {};
    const _name = clean(name, 50);
    const _username = clean(username, 50);
    const _password = clean(password, 200);
    const _role = clean(role, 30);
    const _department = clean(department, 30);

    if (!_name || !_username || !_password || !_role || !_department) {
      return res.status(400).json({ message: "Invalid input" });
    }
    if (hasIllegalChars(_username) || hasIllegalChars(_name)) {
      return res.status(400).json({ message: "Invalid characters in input" });
    }

    const exists = await User.findOne({ username: _username }).lean();
    if (exists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashPassword = await argon2.hash(_password);

    const randomNum = Math.floor(Math.random() * 1000);
    const userId = Date.now().toString().slice(7) + randomNum;

    const newUser = new User({
      name: _name,
      username: _username,
      userId,
      hashPassword,
      role: _role,
      department: _department,
    });
    await newUser.save();

    return res.status(201).json({
      message: "User Created",
      user: {
        name: newUser.name,
        username: newUser.username,
        userId: newUser.userId,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- Login ----------
userRouter.post("/login", async (req, res, next) => {
  try {
    if (!isJson(req)) {
      return res
        .status(415)
        .json({ message: "Unsupported Media Type: use application/json" });
    }

    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "username/password required" });
    }
    if (hasIllegalChars(username)) {
      return res
        .status(400)
        .json({ message: "Invalid characters in username" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "invalid username or password" });
    }

    const isPasswordValid = await argon2.verify(user.hashPassword, password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "invalid username or password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const jwtToken = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        department: user.department,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "login successful",
      authToken: jwtToken,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      id: user.userId,
    });
  } catch (err) {
    return next(err);
  }
});

export default userRouter;

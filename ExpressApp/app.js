import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import userRouter from "./routes/user.js";
import fileRouter from "./routes/file.js";
import commentRouter from "./routes/comment.js";

configDotenv();

const app = express();

// ── 全局安全/解析中间件 ────────────────────────────────
app.use(helmet());
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" })); // 只解析 application/json
// 不启用 urlencoded，避免表单被当作合法请求体：
// app.use(express.urlencoded({ extended: false }));

// 便于调试看到状态码（可选）
app.use(morgan("dev"));

// CORS（开发环境白名单前端）
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ── 路由 ───────────────────────────────────────────────
app.use("/user", userRouter);
app.use("/file", fileRouter);
app.use("/comment", commentRouter);

// 404（可选）
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// 统一错误处理（不要把栈回给前端）
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

const server = http.createServer(app);

// ── DB & 启动 ───────────────────────────────────────────
mongoose
  .connect("mongodb://localhost:27017/abac_lab")
  .then(() => {
    server.listen(3000, () => {
      console.log("server started at port 3000");
    });
  })
  .catch((err) => {
    console.log(`ERROR: ${err}`);
  });

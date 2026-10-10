import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { requireAuth } from "./auth/middleware.js";
import { pool } from "./db/pool.js";
import authRouter from "./routes/auth.js";
import promptsRouter from "./routes/prompts.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 4000);
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be set to at least 32 characters.");
}

if (isProduction) app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "100kb" }));
const PostgresSessionStore = connectPgSimple(session);
app.use(session({
  name: "devprompt.sid",
  store: new PostgresSessionStore({ pool, createTableIfMissing: false }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/prompts", requireAuth, promptsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

if (process.env.VERCEL !== "1") {
  app.listen(port, () => console.log(`Prompt Library API listening on http://localhost:${port}`));
}

export default app;

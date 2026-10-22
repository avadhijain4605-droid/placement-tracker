import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import healthRouter from "./routes/health.js";
import companiesRouter from "./routes/companies.js";
import experiencesRouter from "./routes/experiences.js";
import studentsRouter from "./routes/students.js";
import authRouter from "./routes/auth.js";
import aiRouter from "./routes/ai.js";

// Load server/.env first; fall back to the project-root .env (which persists
// across environment resets) so MONGODB_URI and other secrets stay available.
dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

// CORS must use a concrete origin (not "*") when credentials are included so
// the browser sends the HttpOnly session cookie. The default covers local dev.
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "AI Placement Tracker API. Try GET /api/health" });
});

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/experiences", experiencesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/ai", aiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error("[api] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

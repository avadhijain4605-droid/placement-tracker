import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[api] Server running on http://localhost:${PORT}`);
    console.log(`[api] Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error("[api] Failed to start server:", err);
  process.exit(1);
});

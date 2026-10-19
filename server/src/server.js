import app from "./app.js";
import { connectDB } from "./config/db.js";

// Force a sensible default port. The environment may inject a PORT that is
// already in use (e.g. 9091), so we prefer an explicit value only from .env.
const PORT = Number.parseInt(process.env.PORT, 10) || 5000;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`[api] Server running on http://localhost:${PORT}`);
    console.log(`[api] Health check: http://localhost:${PORT}/api/health`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[api] Port ${PORT} is already in use. Stop the other process or set PORT in server/.env.`);
    } else {
      console.error("[api] Server error:", err.message);
    }
    process.exit(1);
  });

  return server;
}

async function start() {
  // Start the HTTP server first so logs appear immediately, then connect to DB.
  startServer();
  await connectDB();
}

start().catch((err) => {
  console.error("[api] Failed to start server:", err);
  process.exit(1);
});

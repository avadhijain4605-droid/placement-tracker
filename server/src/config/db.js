import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "[db] MONGODB_URI is not set in server/.env. Server will start, but every database call will fail until it is configured."
    );
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    isConnected = true;
    console.log(
      `[db] MongoDB Atlas connection established: ${conn.connection.host}/${conn.connection.name}`
    );

    mongoose.connection.on("error", (err) => {
      console.error("[db] MongoDB runtime error:", err.message);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected.");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[db] MongoDB reconnected.");
      isConnected = true;
    });

    return conn;
  } catch (err) {
    console.error(`[db] Failed to connect to MongoDB Atlas: ${err.message}`);
    console.error(
      "[db] The server will keep running so you can fix the connection (check MONGODB_URI, network, and Atlas IP allowlist), but database features will fail until it is connected."
    );
    return null;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return res
      .status(503)
      .json({ error: "Database unavailable. Please try again later." });
  }
  next();
}

export default mongoose.connection;

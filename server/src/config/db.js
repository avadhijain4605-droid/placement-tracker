import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      "[db] MONGODB_URI is not set. Server will start, but database calls will fail until it is configured."
    );
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[db] MongoDB connection error: ${err.message}`);
    console.error(
      "[db] The server will keep running so you can fix the connection, but DB features will fail."
    );
    return null;
  }
}

export default mongoose.connection;

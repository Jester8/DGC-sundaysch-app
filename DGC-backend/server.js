// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import userRoutes from "./routes/userRoutes.js";
import manualsRouter from "./routes/manuals.js";

// For ES6 modules - get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from public folder
app.use("/public", express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/manuals", manualsRouter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
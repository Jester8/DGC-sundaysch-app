import dotenv from "dotenv";
import mongoose from "mongoose";
import Manual from "../models/Manual.js";

dotenv.config();

const updateManualsWithImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Update January manuals with image URLs
    const imageUpdates = [
      { order: 1, imageUrl: "http://192.168.56.2:5000/public/images/january/king.png" },
      { order: 2, imageUrl: "http://192.168.56.2:5000/public/images/january/king.png" },
      { order: 3, imageUrl: "http://192.168.56.2:5000/public/images/january/king.png" },
    ];

    for (const update of imageUpdates) {
      await Manual.findOneAndUpdate(
        { month: "January", order: update.order },
        { imageUrl: update.imageUrl },
        { new: true }
      );
      console.log(`✅ Updated January Week ${update.order}`);
    }

    console.log("✅ All manuals updated with images!");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

updateManualsWithImages();
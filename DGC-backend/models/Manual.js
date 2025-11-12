
import mongoose from "mongoose";

const mainPointSchema = new mongoose.Schema({
  title: String,
  description: String,
  references: [String]
}, { _id: false });

const manualSchema = new mongoose.Schema({
  id: String,
  title: {
    type: String,
    required: true
  },
  theme: String,
  week: Number,
  date: String,
  memoryVerse: String,
  text: String,
  introduction: String,
  mainPoints: [mainPointSchema],
  classDiscussion: String,
  conclusion: String,
  imageUrl: String,
  month: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Manual', manualSchema);
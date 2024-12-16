const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true },
    comments: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

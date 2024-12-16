const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  course_title: { type: String, required: true },
  level: { type: String, required: true },
  url: { type: String, required: true },
  rating: { type: Number, default: NaN },
  similarity_score: { type: Number, required: true },
  student_name: { type: String, required: true },
  skill: { type: String, required: true },
}, { timestamps: true });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;

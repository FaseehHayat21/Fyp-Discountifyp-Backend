const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Lecture', 'Assignment', 'Reading Material', 'Quiz', 'Other'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
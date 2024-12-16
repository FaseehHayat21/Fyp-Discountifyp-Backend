const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  profilePhoto: { type: String },
  introduction: { type: String },
  name: { type: String },
  email: { type: String },
  phoneNumber: { type: String },
  semester: { type: String },
  location: { type: String },
  skills: { type: [String] }, // Added skills array
});

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);

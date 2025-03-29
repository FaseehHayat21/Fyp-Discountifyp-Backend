const mongoose = require('mongoose');

const instructorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true,
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  introduction: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InstructorProfile', instructorProfileSchema);
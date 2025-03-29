const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
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
  userType: {
    type: String,
    default: 'Instructor', // Set the default userType to 'Student'
    immutable: true,    // Prevent userType from being modified after creation
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Instructor', instructorSchema);
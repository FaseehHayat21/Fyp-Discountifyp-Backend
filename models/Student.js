const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@students\.au\.edu\.pk$/, 'Please enter a valid email address ending with @students.au.edu.pk']
  },
  password: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10,15}$/, 'Please enter a valid phone number'],
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  userType: {
    type: String,
    default: 'Student', // Set the default userType to 'Student'
    immutable: true,    // Prevent userType from being modified after creation
  },
  otp: { type: String }, // Field to store OTP
  otpExpiry: { type: Date }, // Field to store OTP expiry time
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Student", StudentSchema);

const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10,15}$/, 'Please enter a valid phone number'],
  },
  password: {
    type: String,
    required: true,
  },
  
  city: {
    type: String,
    required: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  companyAddress: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  userType: {
    type: String,
    default: 'Vendor', // Set the default userType to 'Student'
    immutable: true,    // Prevent userType from being modified after creation
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vendor", VendorSchema);

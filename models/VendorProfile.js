// models/VendorProfile.js
const mongoose = require('mongoose');

const VendorProfileSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  profilePhoto: { type: String }, // URL to the profile photo
  introduction: { type: String }, // Short introduction
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Reference to posts
});

module.exports = mongoose.model('VendorProfile', VendorProfileSchema);

const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  discountPercentage: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  originalPrice: { type: Number, required: true },
  images: [{ type: String }], // Array to store image file paths
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
});

module.exports = mongoose.model('Deal', DealSchema);
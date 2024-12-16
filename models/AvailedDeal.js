
// models/AvailedDeal.js
const mongoose = require('mongoose');

const AvailedDealSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
  dateAvailed: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AvailedDeal', AvailedDealSchema);

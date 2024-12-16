const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  skills: { type: [String], required: false }, // Optional field for skills
});

module.exports = mongoose.model('Job', JobSchema);

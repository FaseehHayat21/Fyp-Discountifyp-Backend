
const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
  degree: { type: String,  },
  institution: { type: String,  },
  year: { type: String,  },
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, },
  description: { type: String, },
});

const CertificateSchema = new mongoose.Schema({
  title: { type: String,  },
  year: { type: String,  },
});

const CVSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  education: [EducationSchema],
  skills: [String],
  introduction: { type: String },
  projects: [ProjectSchema],
  certificates: [CertificateSchema],  
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Reference to the Student schema
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CV', CVSchema);
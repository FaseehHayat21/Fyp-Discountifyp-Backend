// models/Admin.js
const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: {
    type: String,
    default: 'admin', // Set the default userType to 'Student'
    immutable: true,    // Prevent userType from being modified after creation
  },
});

module.exports = mongoose.model("Admin", AdminSchema);

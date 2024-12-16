const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  studentName: { type: String, required: true },
  dealTitle: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }, // Mark notification as read/unread
});

module.exports = mongoose.model('Notification', NotificationSchema);

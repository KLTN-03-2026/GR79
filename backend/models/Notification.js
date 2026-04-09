const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = thông báo toàn hệ thống
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['order', 'promotion', 'system', 'general'], default: 'general' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

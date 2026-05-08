const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'staff', 'admin'], required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [messageSchema],
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadByAdmin: { type: Number, default: 0 },
  unreadByCustomer: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: 'Hỗ trợ chung'
  },
  message: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);

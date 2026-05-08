const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middlewares/auth');
const {
  getMyConversation,
  getConversations,
  getConversationById,
  sendMessage,
  markAsRead
} = require('../controllers/conversationController');

// User: lấy/tạo conversation của mình
router.get('/mine', protect, getMyConversation);

// Staff/Admin: danh sách tất cả conversations
router.get('/', protect, staffOrAdmin, getConversations);

// Staff/Admin: chi tiết conversation
router.get('/:id', protect, staffOrAdmin, getConversationById);

// Tất cả: gửi tin nhắn
router.post('/:id/messages', protect, sendMessage);

// Tất cả: đánh dấu đã đọc
router.put('/:id/read', protect, markAsRead);

module.exports = router;

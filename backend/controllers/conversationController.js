const Conversation = require('../models/Conversation');

// GET /api/conversations/mine - Lấy hoặc tạo conversation cho user hiện tại
const getMyConversation = async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      customer: req.user._id,
      status: 'active'
    }).populate('customer', 'fullName email avatar')
      .populate('assignedTo', 'fullName email avatar')
      .populate('messages.sender', 'fullName avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        customer: req.user._id,
        messages: []
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('customer', 'fullName email avatar')
        .populate('messages.sender', 'fullName avatar');
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/conversations - Danh sách tất cả conversations (staff/admin)
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('customer', 'fullName email avatar')
      .populate('assignedTo', 'fullName email avatar')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/conversations/:id - Chi tiết conversation (staff/admin)
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('customer', 'fullName email avatar')
      .populate('assignedTo', 'fullName email avatar')
      .populate('messages.sender', 'fullName avatar');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/conversations/:id/messages - Gửi tin nhắn
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
    }

    const senderRole = req.user.role === 'admin' ? 'admin' : (req.user.role === 'staff' ? 'staff' : 'user');

    const message = {
      sender: req.user._id,
      senderRole,
      content: content.trim()
    };

    conversation.messages.push(message);
    conversation.lastMessage = content.trim().substring(0, 100);
    conversation.lastMessageAt = new Date();

    // Cập nhật unread counts
    if (senderRole === 'user') {
      conversation.unreadByAdmin += 1;
    } else {
      conversation.unreadByCustomer += 1;
      // Gán nhân viên xử lý nếu chưa có
      if (!conversation.assignedTo) {
        conversation.assignedTo = req.user._id;
      }
    }

    await conversation.save();

    // Populate sender cho message vừa thêm
    const savedConversation = await Conversation.findById(conversation._id)
      .populate('messages.sender', 'fullName avatar');

    const newMessage = savedConversation.messages[savedConversation.messages.length - 1];

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/conversations/:id/read - Đánh dấu đã đọc
const markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';

    if (isAdmin) {
      conversation.unreadByAdmin = 0;
      // Đánh dấu tất cả tin nhắn của user là đã đọc
      conversation.messages.forEach(msg => {
        if (msg.senderRole === 'user') msg.isRead = true;
      });
    } else {
      conversation.unreadByCustomer = 0;
      // Đánh dấu tất cả tin nhắn của admin/staff là đã đọc
      conversation.messages.forEach(msg => {
        if (msg.senderRole !== 'user') msg.isRead = true;
      });
    }

    await conversation.save();
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyConversation,
  getConversations,
  getConversationById,
  sendMessage,
  markAsRead
};

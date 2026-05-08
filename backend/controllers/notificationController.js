const Notification = require('../models/Notification');
const User = require('../models/User');

// USER: Lấy danh sách thông báo của tôi (cá nhân + toàn hệ thống)
const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { user: req.user._id },
        { isGlobal: true }
      ]
    };

    if (req.query.isRead === 'true') filter.isRead = true;
    if (req.query.isRead === 'false') filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// USER: Đếm số thông báo chưa đọc
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { user: req.user._id },
        { isGlobal: true }
      ],
      isRead: false
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// USER: Đánh dấu 1 thông báo là đã đọc
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    // Kiểm tra quyền: hoặc là của user, hoặc là global
    const isOwner = notification.user && notification.user.toString() === req.user._id.toString();
    if (!isOwner && !notification.isGlobal) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Đã đánh dấu đã đọc', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// USER: Đánh dấu tất cả là đã đọc
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { user: req.user._id },
          { isGlobal: true }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Lấy tất cả thông báo
const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({})
        .populate('user', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({})
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Tạo thông báo mới
const createNotification = async (req, res) => {
  try {
    const { title, content, type, link, userId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung' });
    }

    const isGlobal = !userId;

    // Nếu chỉ định userId, kiểm tra user có tồn tại không
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }
    }

    const notification = await Notification.create({
      title,
      content,
      type: type || 'general',
      link: link || '',
      user: isGlobal ? null : userId,
      isGlobal
    });

    res.status(201).json({ success: true, message: 'Tạo thông báo thành công', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAllNotifications,
  createNotification,
  deleteNotification
};

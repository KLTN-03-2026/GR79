const User = require('../models/User');

// Admin: Lấy danh sách tất cả users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
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

// Admin: Lấy chi tiết user theo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Khóa/mở khóa tài khoản user
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin' || user.role === 'staff') {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản admin/staff' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      data: { isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Tạo tài khoản nhân viên
const createStaffAccount = async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    const allowedRoles = ['staff', 'admin'];
    const assignRole = allowedRoles.includes(role) ? role : 'staff';

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignRole
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: `Đã tạo tài khoản ${assignRole} thành công!`,
      data: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Đổi vai trò người dùng
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'staff', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Không cho phép tự đổi vai trò chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể thay đổi vai trò của chính mình' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `Đã chuyển vai trò thành ${role === 'admin' ? 'Quản trị viên' : role === 'staff' ? 'Nhân viên' : 'Người dùng'}`,
      data: { role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, toggleUserActive, createStaffAccount, changeUserRole };

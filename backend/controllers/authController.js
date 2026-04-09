const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
};

// @desc    Đăng ký tài khoản
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validate
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo user
    const user = await User.create({ fullName, email, password, phone });

    // Tạo token
    const token = generateToken(user._id);

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user và lấy cả password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo token
    const token = generateToken(user._id);

    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, gender, dateOfBirth, address, avatar } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (address !== undefined) updateData.address = address;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.role,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Check mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ====== ADDRESS CRUD ======

// @desc    Lấy danh sách địa chỉ
// @route   GET /api/auth/addresses
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.addresses || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Thêm địa chỉ mới
// @route   POST /api/auth/addresses
const addAddress = async (req, res) => {
  try {
    const { fullName, phone, province, district, ward, detail, isDefault } = req.body;

    if (!fullName || !phone || !province || !district || !ward) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin địa chỉ' });
    }

    const user = await User.findById(req.user._id);

    // Nếu đặt làm mặc định, bỏ mặc định tất cả địa chỉ khác
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Nếu chưa có địa chỉ nào, tự động đặt làm mặc định
    const setDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({ fullName, phone, province, district, ward, detail, isDefault: setDefault });
    await user.save();

    res.status(201).json({ success: true, message: 'Thêm địa chỉ thành công', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật địa chỉ
// @route   PUT /api/auth/addresses/:id
const updateAddress = async (req, res) => {
  try {
    const { fullName, phone, province, district, ward, detail, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (province !== undefined) address.province = province;
    if (district !== undefined) address.district = district;
    if (ward !== undefined) address.ward = ward;
    if (detail !== undefined) address.detail = detail;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.json({ success: true, message: 'Cập nhật địa chỉ thành công', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Xóa địa chỉ
// @route   DELETE /api/auth/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.id);

    // Nếu xóa địa chỉ mặc định, đặt địa chỉ đầu tiên làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({ success: true, message: 'Xóa địa chỉ thành công', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đặt địa chỉ mặc định
// @route   PUT /api/auth/addresses/:id/default
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    user.addresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;

    await user.save();

    res.json({ success: true, message: 'Đặt địa chỉ mặc định thành công', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };

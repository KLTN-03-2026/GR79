const Coupon = require('../models/Coupon');

// Admin: Lấy tất cả mã giảm giá
const getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments()
    ]);

    res.json({
      success: true,
      data: coupons,
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

// Admin: Tạo mã giảm giá
const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      usageLimit: usageLimit || 0,
      startDate,
      endDate
    });

    res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Cập nhật mã giảm giá
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    res.json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Xóa mã giảm giá
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate mã giảm giá (user)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
    }

    const now = new Date();

    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến thời gian sử dụng' });
    }

    if (now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (orderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`
      });
    }

    // Tính discount amount
    let discountAmount = 0;
    if (orderAmount) {
      if (coupon.discountType === 'percent') {
        discountAmount = Math.round(orderAmount * coupon.discountValue / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }
    }

    res.json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public/User: Lấy danh sách voucher khả dụng
const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: 0 },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon, getAvailableCoupons };

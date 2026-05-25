const crypto = require('crypto');
const Order = require('../models/Order');
const Book = require('../models/Book');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');

// Tạo đơn hàng
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'COD', coupon: couponCode, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin giao hàng' });
    }

    // Validate items và tính tổng tiền
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const book = await Book.findById(item.bookId || item.book);
      if (!book) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sách với ID: ${item.bookId || item.book}` });
      }

      if (book.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sách "${book.title}" chỉ còn ${book.stock} cuốn trong kho`
        });
      }

      const itemPrice = book.price;
      subtotal += itemPrice * item.quantity;

      orderItems.push({
        book: book._id,
        title: book.title,
        image: book.images && book.images.length > 0 ? book.images[0] : '',
        price: itemPrice,
        quantity: item.quantity
      });
    }

    // Tính phí vận chuyển
    const shippingFee = subtotal >= 300000 ? 0 : 30000;

    // Áp mã giảm giá nếu có
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
      }

      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`
        });
      }

      if (coupon.discountType === 'percent') {
        discount = Math.round(subtotal * coupon.discountValue / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }

      coupon.usedCount += 1;
      await coupon.save();
      couponId = coupon._id;
    }

    const total = subtotal + shippingFee - discount;

    // Tạo đơn hàng
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total: total > 0 ? total : 0,
      coupon: couponId,
      note: note || ''
    });

    // Trừ stock và tăng sold
    for (const item of orderItems) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: -item.quantity, sold: item.quantity }
      });
    }

    // Xóa giỏ hàng sau khi đặt hàng
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: 'Đặt hàng thành công', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách đơn hàng của user
const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.book', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
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

// Lấy chi tiết đơn hàng theo ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('items.book', 'title images price')
      .populate('coupon', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Chỉ user sở hữu hoặc admin mới xem được
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Không có quyền xem đơn hàng này' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Lấy tất cả đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    // Tìm kiếm theo mã đơn HOẶC tên khách hàng (cả từ user và shippingAddress)
    if (req.query.search) {
      const kw = req.query.search.trim();
      const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: safeKw, $options: 'i' };

      // Tìm các user có fullName/email/phone match
      const User = require('../models/User');
      const matchingUsers = await User.find({
        $or: [
          { fullName: regex },
          { email: regex },
          { phone: regex }
        ]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { orderCode: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { user: { $in: userIds } }
      ];
    }

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(filter)
        .populate('user', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const counts = {};
    let allCount = 0;
    statusCounts.forEach(s => {
      counts[s._id] = s.count;
      allCount += s.count;
    });
    counts.all = allCount;

    res.json({
      success: true,
      data: orders,
      counts,
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

// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Nếu hủy đơn hàng, hoàn lại stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, {
          $inc: { stock: item.quantity, sold: -item.quantity }
        });
      }
    }

    // Nếu giao thành công, cập nhật payment status
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }

    order.status = status;
    await order.save();

    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo URL thanh toán VNPay
const createVNPayUrl = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền thanh toán đơn hàng này' });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const date = new Date();
    const createDate = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

    const txnRef = order.orderCode + '-' + Date.now();

    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order.orderCode;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(order.total * 100);
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort params theo alphabet
    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
      sortedParams[key] = vnp_Params[key];
    });

    // Build signData bằng URLSearchParams (tự encode đúng chuẩn)
    const signData = new URLSearchParams(sortedParams).toString();

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Thêm vnp_SecureHash vào URL
    const paymentUrl = vnpUrl + '?' + signData + '&vnp_SecureHash=' + signed;

    // Lưu txnRef vào order để đối chiếu sau
    order.vnpTxnRef = txnRef;
    await order.save();

    res.json({ success: true, data: { paymentUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xác minh kết quả thanh toán VNPay
const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa hash params trước khi verify
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params và tạo signData
    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
      sortedParams[key] = vnp_Params[key];
    });
    const signData = new URLSearchParams(sortedParams).toString();

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const txnRef = vnp_Params['vnp_TxnRef'];

      // Cập nhật trạng thái thanh toán nếu thành công
      if (responseCode === '00') {
        const order = await Order.findOne({ vnpTxnRef: txnRef });
        if (order) {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'VNPAY';
          await order.save();
        }
      }

      res.json({ success: true, code: responseCode });
    } else {
      res.json({ success: false, message: 'Chữ ký không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User tự hủy đơn hàng (chỉ khi đang ở trạng thái pending)
const cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền hủy đơn hàng này' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn hàng đang chờ xác nhận' });
    }

    // Hoàn lại stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: item.quantity, sold: -item.quantity }
      });
    }

    // Nếu đơn VNPay đã thanh toán -> đánh dấu hoàn tiền để FE hiển thị thông báo
    const isVNPayPaid =
      (order.paymentMethod || '').toUpperCase() === 'VNPAY' &&
      order.paymentStatus === 'paid';

    order.status = 'cancelled';
    if (isVNPayPaid) order.refundedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      refunded: isVNPayPaid,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createVNPayUrl,
  vnpayReturn,
  cancelMyOrder
};

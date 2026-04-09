const Cart = require('../models/Cart');
const Book = require('../models/Book');

// Lấy giỏ hàng của user
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.book', 'title slug price originalPrice discount images stock');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Lọc bỏ những item mà book đã bị xóa
    cart.items = cart.items.filter(item => item.book !== null);

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Sách không đủ số lượng trong kho' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ book: bookId, quantity }]
      });
    } else {
      const existingItem = cart.items.find(
        item => item.book.toString() === bookId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        if (existingItem.quantity > book.stock) {
          return res.status(400).json({ success: false, message: 'Vượt quá số lượng tồn kho' });
        }
      } else {
        cart.items.push({ book: bookId, quantity });
      }

      await cart.save();
    }

    await cart.populate('items.book', 'title slug price originalPrice discount images stock');

    res.json({ success: true, message: 'Đã thêm vào giỏ hàng', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ
const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    if (quantity > book.stock) {
      return res.status(400).json({ success: false, message: 'Vượt quá số lượng tồn kho' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const item = cart.items.find(item => item.book.toString() === bookId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
    }

    item.quantity = quantity;
    await cart.save();

    await cart.populate('items.book', 'title slug price originalPrice discount images stock');

    res.json({ success: true, message: 'Đã cập nhật giỏ hàng', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    cart.items = cart.items.filter(item => item.book.toString() !== bookId);
    await cart.save();

    await cart.populate('items.book', 'title slug price originalPrice discount images stock');

    res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };

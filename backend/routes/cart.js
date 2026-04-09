const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateCartItem);
router.delete('/:bookId', protect, removeFromCart);
router.delete('/', protect, clearCart);

module.exports = router;

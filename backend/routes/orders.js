const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middlewares/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createVNPayUrl,
  vnpayReturn,
  cancelMyOrder
} = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.post('/vnpay-create', protect, createVNPayUrl);
router.get('/vnpay-return', vnpayReturn);
router.put('/:id/cancel', protect, cancelMyOrder);
router.get('/', protect, staffOrAdmin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, staffOrAdmin, updateOrderStatus);

module.exports = router;

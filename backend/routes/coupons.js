const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getAvailableCoupons
} = require('../controllers/couponController');

router.get('/available', getAvailableCoupons);
router.get('/', protect, adminOnly, getAllCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);
router.post('/validate', protect, validateCoupon);

module.exports = router;

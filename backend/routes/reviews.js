const express = require('express');
const router = express.Router();
const { getReviewsByBook, createReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

// GET /api/reviews/:bookId - Lấy đánh giá theo sách (public)
router.get('/:bookId', getReviewsByBook);

// POST /api/reviews - Tạo đánh giá (cần đăng nhập)
router.post('/', protect, createReview);

// DELETE /api/reviews/:id - Xóa đánh giá (cần đăng nhập, chỉ owner hoặc admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;

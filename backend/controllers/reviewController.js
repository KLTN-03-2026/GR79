const Review = require('../models/Review');
const Book = require('../models/Book');

// Cập nhật rating trung bình và số lượng đánh giá cho sách
async function updateBookRating(bookId) {
  const stats = await Review.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: '$book',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews
    });
  } else {
    await Book.findByIdAndUpdate(bookId, {
      rating: 0,
      numReviews: 0
    });
  }
}

// @desc    Lấy danh sách đánh giá theo sách
// @route   GET /api/reviews/:bookId
// @access  Public
const getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ book: bookId })
      .populate('user', 'fullName avatar')
      .sort({ createdAt: -1 });

    // Tính trung bình rating
    const totalReviews = reviews.length;
    let avgRating = 0;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      let sum = 0;
      reviews.forEach(r => {
        sum += r.rating;
        const star = Math.min(5, Math.max(1, Math.round(r.rating)));
        starCounts[star]++;
      });
      avgRating = Math.round((sum / totalReviews) * 10) / 10;
    }

    res.json({
      success: true,
      data: {
        reviews,
        avgRating,
        totalReviews,
        starCounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải đánh giá' });
  }
};

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;

    if (!bookId || !rating) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn sách và số sao' });
    }

    // Kiểm tra sách tồn tại
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await Review.findOne({ book: bookId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sách này rồi' });
    }

    const review = await Review.create({
      book: bookId,
      user: req.user._id,
      rating: Number(rating),
      comment: comment || ''
    });

    // Cập nhật rating trung bình cho sách
    await updateBookRating(book._id);

    // Populate user info để trả về
    await review.populate('user', 'fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công!',
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sách này rồi' });
    }
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tạo đánh giá' });
  }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private (owner hoặc admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    // Chỉ owner hoặc admin mới được xóa
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này' });
    }

    const bookId = review.book;
    await review.deleteOne();

    // Cập nhật lại rating cho sách
    await updateBookRating(bookId);

    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa đánh giá' });
  }
};

module.exports = { getReviewsByBook, createReview, deleteReview };

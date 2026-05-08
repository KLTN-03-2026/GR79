const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Vui lòng chọn sách để đánh giá']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng đăng nhập để đánh giá']
  },
  rating: {
    type: Number,
    required: [true, 'Vui lòng chọn số sao'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// 1 user chỉ đánh giá 1 sách 1 lần
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

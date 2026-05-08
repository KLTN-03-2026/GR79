// Script reset rating tất cả sách - tính lại từ đánh giá thực tế
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');
const Review = require('./models/Review');
const connectDB = require('./config/db');

async function resetAllRatings() {
  await connectDB();

  const books = await Book.find({});
  console.log(`Tìm thấy ${books.length} sách. Đang tính lại rating...`);

  for (const book of books) {
    const stats = await Review.aggregate([
      { $match: { book: book._id } },
      {
        $group: {
          _id: '$book',
          avgRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      book.rating = Math.round(stats[0].avgRating * 10) / 10;
      book.numReviews = stats[0].numReviews;
    } else {
      book.rating = 0;
      book.numReviews = 0;
    }

    await book.save({ validateBeforeSave: false });
    console.log(`  ${book.title}: ${book.rating} sao (${book.numReviews} đánh giá)`);
  }

  console.log('Hoàn tất reset rating!');
  process.exit(0);
}

resetAllRatings().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});

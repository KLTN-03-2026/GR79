const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const Book = require('./models/Book');

// Ảnh công khai từ nguồn ổn định (Open Library Covers + Unsplash)
const bookImages = {
  'Đắc Nhân Tâm': 'https://m.media-amazon.com/images/I/71vK0WVQ4rL._AC_UF1000,1000_QL80_.jpg',
  'Nhà Giả Kim': 'https://m.media-amazon.com/images/I/71aFt4+OTOL._AC_UF1000,1000_QL80_.jpg',
  'Tuổi Trẻ Đáng Giá Bao Nhiêu': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
  'Người Giàu Có Nhất Thành Babylon': 'https://m.media-amazon.com/images/I/71sLtEfMRVL._AC_UF1000,1000_QL80_.jpg',
  'Mắt Biếc': 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'Sapiens: Lược Sử Loài Người': 'https://m.media-amazon.com/images/I/71N3-2sYDRL._AC_UF1000,1000_QL80_.jpg',
  'Cây Cam Ngọt Của Tôi': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'Tâm Lý Học Về Tiền': 'https://m.media-amazon.com/images/I/71TRUbzcvaL._AC_UF1000,1000_QL80_.jpg',
  'Doraemon - Tập 1': 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=400&h=600&fit=crop',
  'English Grammar In Use': 'https://m.media-amazon.com/images/I/81GF579VanL._AC_UF1000,1000_QL80_.jpg',
  'Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ': 'https://m.media-amazon.com/images/I/81bGKUa1e0L._AC_UF1000,1000_QL80_.jpg',
  'Dế Mèn Phiêu Lưu Ký': 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop'
};

const uploadImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    const books = await Book.find({});
    console.log(`Tìm thấy ${books.length} sách, bắt đầu upload ảnh lên Cloudinary...\n`);

    for (const book of books) {
      const imageUrl = bookImages[book.title];
      if (!imageUrl) {
        console.log(`⏭ Không có ảnh cho: ${book.title}`);
        continue;
      }

      try {
        console.log(`⬆ Đang upload: ${book.title}...`);
        const result = await cloudinary.uploader.upload(imageUrl, {
          folder: 'sachhub/books',
          public_id: book.slug,
          transformation: [{ width: 400, height: 550, crop: 'fill', gravity: 'center' }]
        });

        book.images = [result.secure_url];
        await book.save();
        console.log(`✓ Xong: ${book.title} → ${result.secure_url}`);
      } catch (err) {
        console.log(`✗ Lỗi upload ${book.title}: ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log('Upload ảnh hoàn tất!');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

uploadImages();

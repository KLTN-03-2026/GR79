const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const inputDir = path.join(__dirname, '..', 'database');

// Danh sách collection import (thứ tự quan trọng: users trước vì các collection khác ref tới)
const COLLECTIONS = [
  'users', 'categories', 'books', 'carts', 'orders',
  'coupons', 'blogs', 'contacts', 'notifications', 'jobs'
];

async function importDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log('MongoDB connected...\n');

    if (!fs.existsSync(inputDir)) {
      console.error(`Thư mục "${inputDir}" không tồn tại!`);
      console.error('Chạy "node export-db.js" trước để tạo dữ liệu.');
      process.exit(1);
    }

    let totalDocs = 0;
    let errors = 0;

    for (const name of COLLECTIONS) {
      const filePath = path.join(inputDir, `${name}.json`);

      if (!fs.existsSync(filePath)) {
        console.log(`  ⏭ ${name}.json — không tìm thấy, bỏ qua`);
        continue;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      let docs = JSON.parse(raw);

      if (!Array.isArray(docs) || docs.length === 0) {
        console.log(`  ⏭ ${name}.json — rỗng, bỏ qua`);
        continue;
      }

      // Chuyển _id string → ObjectId
      docs = docs.map(doc => {
        if (doc._id && typeof doc._id === 'string') {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        }
        // Chuyển các field ref ObjectId phổ biến
        ['user', 'category', 'author', 'coupon', 'book'].forEach(field => {
          if (doc[field] && typeof doc[field] === 'string' && doc[field].match(/^[0-9a-fA-F]{24}$/)) {
            doc[field] = new mongoose.Types.ObjectId(doc[field]);
          }
        });
        // Chuyển ObjectId trong mảng items
        if (Array.isArray(doc.items)) {
          doc.items = doc.items.map(item => {
            if (item._id && typeof item._id === 'string') {
              item._id = new mongoose.Types.ObjectId(item._id);
            }
            if (item.book && typeof item.book === 'string' && item.book.match(/^[0-9a-fA-F]{24}$/)) {
              item.book = new mongoose.Types.ObjectId(item.book);
            }
            return item;
          });
        }
        // Chuyển ObjectId trong mảng addresses
        if (Array.isArray(doc.addresses)) {
          doc.addresses = doc.addresses.map(addr => {
            if (addr._id && typeof addr._id === 'string') {
              addr._id = new mongoose.Types.ObjectId(addr._id);
            }
            return addr;
          });
        }
        // Chuyển Date strings
        ['createdAt', 'updatedAt', 'startDate', 'endDate', 'deadline', 'dateOfBirth'].forEach(field => {
          if (doc[field] && typeof doc[field] === 'string') {
            doc[field] = new Date(doc[field]);
          }
        });
        return doc;
      });

      try {
        // Xóa collection cũ
        await db.collection(name).deleteMany({});

        // Drop indexes cũ (tránh lỗi duplicate/language)
        try { await db.collection(name).dropIndexes(); } catch (e) {}

        // Insert raw data
        await db.collection(name).insertMany(docs, { ordered: false });

        totalDocs += docs.length;
        console.log(`  ✓ ${name} — ${docs.length} documents imported`);
      } catch (err) {
        errors++;
        console.log(`  ✗ ${name} — Lỗi: ${err.message}`);
      }
    }

    // Tạo lại indexes cần thiết
    console.log('\nTạo lại indexes...');
    try {
      await db.collection('books').createIndex(
        { title: 'text', author: 'text' },
        { default_language: 'none', language_override: 'searchLang' }
      );
      console.log('  ✓ books text index');
    } catch (e) { console.log('  ⏭ books text index:', e.message); }

    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('  ✓ users email index');
    } catch (e) { console.log('  ⏭ users email index:', e.message); }

    try {
      await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
      console.log('  ✓ coupons code index');
    } catch (e) { console.log('  ⏭ coupons code index:', e.message); }

    console.log('\n========================================');
    console.log('IMPORT HOÀN TẤT!');
    console.log(`Tổng: ${totalDocs} documents, ${errors} lỗi`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Import error:', error.message);
    process.exit(1);
  }
}

importDB();

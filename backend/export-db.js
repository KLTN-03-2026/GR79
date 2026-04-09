const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const outputDir = path.join(__dirname, '..', 'database');

// Danh sách collection cần export
const COLLECTIONS = [
  'users', 'categories', 'books', 'carts', 'orders',
  'coupons', 'blogs', 'contacts', 'notifications', 'jobs'
];

async function exportDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log('MongoDB connected...\n');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let totalDocs = 0;

    for (const name of COLLECTIONS) {
      // Dùng raw collection → lấy đúng 100% data gốc từ DB, không bị select/filter
      const docs = await db.collection(name).find({}).toArray();
      const filePath = path.join(outputDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      totalDocs += docs.length;
      console.log(`  ✓ ${name}.json — ${docs.length} documents`);
    }

    console.log('\n========================================');
    console.log('EXPORT HOÀN TẤT!');
    console.log(`Thư mục: ${outputDir}`);
    console.log(`Tổng: ${COLLECTIONS.length} collections, ${totalDocs} documents`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Export error:', error.message);
    process.exit(1);
  }
}

exportDB();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Order = require('./models/Order');
const Blog = require('./models/Blog');
const Coupon = require('./models/Coupon');
const Notification = require('./models/Notification');
const Job = require('./models/Job');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data + indexes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Book.deleteMany({});
    await Blog.deleteMany({});
    await Coupon.deleteMany({});
    await Notification.deleteMany({});
    await Job.deleteMany({});

    // Drop indexes to avoid slug conflicts
    await Category.collection.dropIndexes().catch(() => {});
    await Book.collection.dropIndexes().catch(() => {});
    await Order.deleteMany({});
    await Order.collection.dropIndexes().catch(() => {});
    await Blog.collection.dropIndexes().catch(() => {});
    await Job.collection.dropIndexes().catch(() => {});

    // ====== USERS ======
    const admin = await User.create({
      fullName: 'Admin Sách Hub',
      email: 'admin@sachhub.vn',
      phone: '0901234567',
      password: 'admin123',
      role: 'admin',
      gender: 'Nam',
      points: 5000
    });

    const staff = await User.create({
      fullName: 'Nhân Viên Sách Hub',
      email: 'staff@sachhub.vn',
      phone: '0903456789',
      password: 'staff123',
      role: 'staff',
      gender: 'Nữ',
      points: 500
    });

    const user1 = await User.create({
      fullName: 'Nguyễn Văn Anh',
      email: 'user@sachhub.vn',
      phone: '0912345678',
      password: 'user123',
      role: 'user',
      gender: 'Nam',
      address: '3 Quang Trung, Hải Châu, TP. Đà Nẵng',
      points: 1250
    });

    const user2 = await User.create({
      fullName: 'Trần Thị Bích',
      email: 'user2@sachhub.vn',
      phone: '0987654321',
      password: 'user123',
      role: 'user',
      gender: 'Nữ',
      address: '3 Quang Trung, Hải Châu, TP. Đà Nẵng',
      points: 800
    });

    console.log('Users seeded!');

    // ====== CATEGORIES ======
    const categories = await Category.create([
      { name: 'Văn học', description: 'Tiểu thuyết, truyện ngắn, thơ ca trong và ngoài nước' },
      { name: 'Kỹ năng sống', description: 'Phát triển bản thân, kỹ năng giao tiếp, lãnh đạo' },
      { name: 'Kinh tế', description: 'Kinh doanh, tài chính, quản trị, marketing' },
      { name: 'Thiếu nhi', description: 'Truyện tranh, sách giáo dục, truyện cổ tích' },
      { name: 'Ngoại ngữ', description: 'Tiếng Anh, tiếng Nhật, tiếng Hàn, tiếng Trung' },
      { name: 'Khoa học', description: 'Khoa học tự nhiên, công nghệ, y học' }
    ]);

    console.log('Categories seeded!');

    // ====== BOOKS ======


    const books = await Book.create([
      {
        title: 'Đắc Nhân Tâm',
        author: 'Dale Carnegie',
        publisher: 'NXB Tổng hợp TP.HCM',
        category: categories[1]._id,
        description: 'Đắc nhân tâm là cuốn sách nổi tiếng nhất, bán chạy nhất và có tầm ảnh hưởng nhất của mọi thời đại. Tác phẩm đã được chuyển ngữ sang hầu hết các thứ tiếng trên thế giới và có mặt ở hàng trăm quốc gia.',
        price: 76000,
        originalPrice: 108000,
        discount: 30,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/df/7d/da/cc48e4e2deda3c8de8e4d24af0a7848e.png'],
        stock: 150,
        sold: 2341,
        pages: 320,
        publishYear: 2020,
        rating: 0,
        numReviews: 0,
        isFeatured: true
      },
      {
        title: 'Nhà Giả Kim',
        author: 'Paulo Coelho',
        publisher: 'NXB Văn Học',
        category: categories[0]._id,
        description: 'Tất cả những trải nghiệm trong chuyến phiêu du theo đuổi vận mệnh của mình đã giúp Santiago nhận ra được ý nghĩa sâu xa nhất của hạnh phúc, hòa hợp với vũ trụ và khám phá ra Linh Hồn Thế Giới.',
        price: 63000,
        originalPrice: 79000,
        discount: 20,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/34/6e/59/5e8b790c2bcbf5a1c3e5f3e4e3206836.jpg'],
        stock: 200,
        sold: 1856,
        pages: 228,
        publishYear: 2019,
        rating: 0,
        numReviews: 0,
        isFeatured: true
      },
      {
        title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
        author: 'Rosie Nguyễn',
        publisher: 'NXB Hội Nhà Văn',
        category: categories[1]._id,
        description: 'Cuốn sách dành cho bạn trẻ đang hoang mang trên con đường tìm kiếm mục đích sống.',
        price: 58000,
        originalPrice: 85000,
        discount: 32,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/9c/0c/a0/2c32bfb0812e3384e045375bc449d1c7.jpg'],
        stock: 80,
        sold: 987,
        pages: 285,
        publishYear: 2021,
        rating: 0,
        numReviews: 0,
        isFeatured: true
      },
      {
        title: 'Người Giàu Có Nhất Thành Babylon',
        author: 'George S. Clason',
        publisher: 'NXB Lao Động',
        category: categories[2]._id,
        description: 'Cuốn sách đưa ra những lời khuyên về tài chính thông qua những câu chuyện ngụ ngôn thú vị đặt bối cảnh ở thành Babylon cổ đại.',
        price: 48000,
        originalPrice: 62000,
        discount: 22,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/9e/f3/31/6ad30e6f6a41c63a47e9aed6e2c44d18.jpg'],
        stock: 120,
        sold: 654,
        pages: 208,
        publishYear: 2020,
        rating: 0,
        numReviews: 0,
        isFlashSale: true
      },
      {
        title: 'Mắt Biếc',
        author: 'Nguyễn Nhật Ánh',
        publisher: 'NXB Trẻ',
        category: categories[0]._id,
        description: 'Mắt Biếc là một trong những tác phẩm tiêu biểu và sâu đậm nhất của nhà văn Nguyễn Nhật Ánh. Tác phẩm kể về câu chuyện tình yêu trong sáng của chàng trai Ngạn dành cho cô gái Hà Lan.',
        price: 95000,
        originalPrice: 125000,
        discount: 24,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/8a/27/e8/e54de50131c2cb582f22d2f147ef52d0.jpg'],
        stock: 300,
        sold: 3200,
        pages: 260,
        publishYear: 2019,
        rating: 0,
        numReviews: 0,
        isFeatured: true,
        isFlashSale: true
      },
      {
        title: 'Sapiens: Lược Sử Loài Người',
        author: 'Yuval Noah Harari',
        publisher: 'NXB Tri Thức',
        category: categories[5]._id,
        description: 'Sapiens khám phá lịch sử loài người từ thời kỳ đồ đá cho đến thế kỷ 21, giải thích cách mà Homo sapiens trở thành loài thống trị trên Trái Đất.',
        price: 135000,
        originalPrice: 199000,
        discount: 32,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/9a/3e/d0/4f5b7e91eaa3e6a6d38de93a1b1e2c9b.jpg'],
        stock: 90,
        sold: 1200,
        pages: 560,
        publishYear: 2022,
        rating: 0,
        numReviews: 0,
        isFlashSale: true
      },
      {
        title: 'Cây Cam Ngọt Của Tôi',
        author: 'José Mauro de Vasconcelos',
        publisher: 'NXB Hội Nhà Văn',
        category: categories[0]._id,
        description: 'Câu chuyện cậu bé Zezé với trí tưởng tượng phong phú và tâm hồn nhạy cảm, sống trong gia đình nghèo khó nhưng luôn giữ được trái tim ấm áp.',
        price: 86000,
        originalPrice: 108000,
        discount: 20,
        images: ['https://salt.tikicdn.com/cache/280x280/media/catalog/producttmp/3d/1a/84/d3fec0b3bfae80cfb70a9e1e05e33e48.jpg'],
        stock: 180,
        sold: 1500,
        pages: 244,
        publishYear: 2020,
        rating: 0,
        numReviews: 0,
        isFeatured: true
      },
      {
        title: 'Tâm Lý Học Về Tiền',
        author: 'Morgan Housel',
        publisher: 'NXB Lao Động',
        category: categories[2]._id,
        description: 'Cuốn sách giúp bạn hiểu về tâm lý đằng sau những quyết định tài chính của con người.',
        price: 99000,
        originalPrice: 149000,
        discount: 34,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/22/cb/a9/524a27dcd45e8a26b8eb3ef537c53989.jpg'],
        stock: 5,
        sold: 890,
        pages: 312,
        publishYear: 2023,
        rating: 0,
        numReviews: 0,
        isFlashSale: true
      },
      {
        title: 'Doraemon - Tập 1',
        author: 'Fujiko F. Fujio',
        publisher: 'NXB Kim Đồng',
        category: categories[3]._id,
        description: 'Bộ truyện tranh nổi tiếng nhất Nhật Bản về chú mèo máy Doraemon đến từ tương lai.',
        price: 22000,
        originalPrice: 25000,
        discount: 12,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/0b/a3/a5/bda0ef6a3e7c2138780b4ea2b4c2a133.jpg'],
        stock: 500,
        sold: 5000,
        pages: 192,
        publishYear: 2022,
        rating: 0,
        numReviews: 0,
        isFeatured: true
      },
      {
        title: 'English Grammar In Use',
        author: 'Raymond Murphy',
        publisher: 'Cambridge University Press',
        category: categories[4]._id,
        description: 'Cuốn sách ngữ pháp tiếng Anh bán chạy nhất thế giới, dành cho trình độ trung cấp.',
        price: 180000,
        originalPrice: 250000,
        discount: 28,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/bc/63/a8/edc00acfae61e891e41c16dae4f6e0fa.jpg'],
        stock: 70,
        sold: 780,
        pages: 394,
        publishYear: 2023,
        rating: 0,
        numReviews: 0
      },
      {
        title: 'Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ',
        author: 'James Clear',
        publisher: 'NXB Thế Giới',
        category: categories[1]._id,
        description: 'Cuốn sách hướng dẫn bạn xây dựng thói quen tốt và từ bỏ thói quen xấu thông qua những thay đổi nhỏ nhưng hiệu quả.',
        price: 120000,
        originalPrice: 169000,
        discount: 29,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/6e/9f/d7/1c58ed31ab4d06e2f89d8c0a96e3e3a8.jpg'],
        stock: 250,
        sold: 2100,
        pages: 352,
        publishYear: 2023,
        rating: 0,
        numReviews: 0,
        isFeatured: true,
        isFlashSale: true
      },
      {
        title: 'Dế Mèn Phiêu Lưu Ký',
        author: 'Tô Hoài',
        publisher: 'NXB Kim Đồng',
        category: categories[3]._id,
        description: 'Tác phẩm kinh điển của văn học thiếu nhi Việt Nam kể về cuộc phiêu lưu của chú Dế Mèn.',
        price: 35000,
        originalPrice: 45000,
        discount: 22,
        images: ['https://salt.tikicdn.com/cache/280x280/ts/product/fb/4c/21/8a7e38b16bc57aba1693d4fd70b91c8e.jpg'],
        stock: 400,
        sold: 1800,
        pages: 178,
        publishYear: 2021,
        rating: 0,
        numReviews: 0
      }
    ]);

    console.log('Books seeded!');

    // ====== ORDERS ======
    const orderDefs = [
      // 5 delivered (có doanh thu)
      { status: 'delivered', paymentStatus: 'paid', daysAgo: 0, bookIndexes: [0, 4], quantities: [2, 1], paymentMethod: 'VNPAY' },
      { status: 'delivered', paymentStatus: 'paid', daysAgo: 1, bookIndexes: [1, 2, 7], quantities: [1, 1, 1], paymentMethod: 'COD' },
      { status: 'delivered', paymentStatus: 'paid', daysAgo: 2, bookIndexes: [5], quantities: [2], paymentMethod: 'VNPAY' },
      { status: 'delivered', paymentStatus: 'paid', daysAgo: 4, bookIndexes: [10, 3], quantities: [1, 2], paymentMethod: 'COD' },
      { status: 'delivered', paymentStatus: 'paid', daysAgo: 6, bookIndexes: [6, 8], quantities: [1, 3], paymentMethod: 'VNPAY' },
      // 3 shipping
      { status: 'shipping', paymentStatus: 'pending', daysAgo: 0, bookIndexes: [3, 9], quantities: [1, 1], paymentMethod: 'COD' },
      { status: 'shipping', paymentStatus: 'paid', daysAgo: 1, bookIndexes: [0], quantities: [1], paymentMethod: 'VNPAY' },
      { status: 'shipping', paymentStatus: 'pending', daysAgo: 2, bookIndexes: [11, 2], quantities: [2, 1], paymentMethod: 'COD' },
      // 2 confirmed
      { status: 'confirmed', paymentStatus: 'pending', daysAgo: 0, bookIndexes: [7, 1], quantities: [1, 2], paymentMethod: 'COD' },
      { status: 'confirmed', paymentStatus: 'paid', daysAgo: 1, bookIndexes: [4], quantities: [1], paymentMethod: 'VNPAY' },
      // 2 pending
      { status: 'pending', paymentStatus: 'pending', daysAgo: 0, bookIndexes: [10, 5, 8], quantities: [1, 1, 2], paymentMethod: 'COD' },
      { status: 'pending', paymentStatus: 'pending', daysAgo: 1, bookIndexes: [6], quantities: [2], paymentMethod: 'VNPAY' },
      // 1 cancelled
      { status: 'cancelled', paymentStatus: 'pending', daysAgo: 3, bookIndexes: [0, 11], quantities: [1, 1], paymentMethod: 'COD' }
    ];

    const stockUpdates = {};

    for (const def of orderDefs) {
      const items = def.bookIndexes.map((bi, idx) => {
        const book = books[bi];
        const qty = def.quantities[idx];
        // Track stock/sold updates for delivered orders
        if (def.status === 'delivered') {
          const bookId = book._id.toString();
          if (!stockUpdates[bookId]) stockUpdates[bookId] = { sold: 0, stock: 0 };
          stockUpdates[bookId].sold += qty;
          stockUpdates[bookId].stock += qty;
        }
        return {
          book: book._id,
          title: book.title,
          image: book.images[0] || '',
          price: book.price,
          quantity: qty
        };
      });

      const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const shippingFee = subtotal >= 300000 ? 0 : 30000;
      const total = subtotal + shippingFee;
      const createdAt = new Date(Date.now() - def.daysAgo * 86400000);

      await Order.create({
        user: user1._id,
        items,
        shippingAddress: {
          fullName: 'Nguyễn Văn Anh',
          phone: '0912345678',
          address: '3 Quang Trung, Hải Châu, TP. Đà Nẵng'
        },
        paymentMethod: def.paymentMethod,
        paymentStatus: def.paymentStatus,
        subtotal,
        shippingFee,
        total,
        status: def.status,
        createdAt
      });
    }

    // Update stock & sold for books in delivered orders
    for (const [bookId, updates] of Object.entries(stockUpdates)) {
      await Book.findByIdAndUpdate(bookId, {
        $inc: { sold: updates.sold, stock: -updates.stock }
      });
    }

    console.log(`Orders seeded! (${orderDefs.length} đơn hàng)`);

    // ====== BLOGS ======
    await Blog.create([
      {
        title: 'Top 10 cuốn sách kinh điển về quản trị kinh doanh bạn không thể bỏ qua',
        content: '<p>Trong thế giới kinh doanh đầy cạnh tranh, việc liên tục học hỏi là điều không thể thiếu. Dưới đây là 10 cuốn sách kinh điển mà mọi nhà quản trị nên đọc ít nhất một lần trong đời.</p><h3>1. Đắc Nhân Tâm - Dale Carnegie</h3><p>Cuốn sách này không chỉ về kinh doanh mà còn về nghệ thuật giao tiếp và xây dựng mối quan hệ...</p><h3>2. Từ Tốt Đến Vĩ Đại - Jim Collins</h3><p>Jim Collins nghiên cứu hàng trăm công ty để tìm ra công thức biến doanh nghiệp tốt thành vĩ đại...</p>',
        excerpt: 'Những cuốn sách kinh doanh hay nhất mọi thời đại mà bạn không thể bỏ qua trong năm 2026.',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
        category: 'Review Sách',
        tags: ['kinh doanh', 'quản trị', 'sách hay'],
        author: admin._id,
        views: 1250
      },
      {
        title: 'Phong cách đọc sách hiệu quả của người Nhật',
        content: '<p>Người Nhật nổi tiếng với văn hóa đọc sách. Trung bình mỗi người Nhật đọc 12-13 cuốn sách mỗi năm. Vậy bí quyết của họ là gì?</p><h3>Phương pháp đọc 3-2-1</h3><p>Đọc 3 chương, ghi chú 2 điểm quan trọng, áp dụng 1 bài học ngay lập tức...</p>',
        excerpt: 'Khám phá phương pháp đọc sách độc đáo giúp người Nhật tiếp thu kiến thức nhanh hơn.',
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
        category: 'Kinh Nghiệm Đọc',
        tags: ['đọc sách', 'Nhật Bản', 'phương pháp'],
        author: admin._id,
        views: 890
      },
      {
        title: 'Xu hướng AudioBook: Tương lai của ngành xuất bản Việt Nam',
        content: '<p>AudioBook đang trở thành xu hướng mới trong ngành xuất bản, thay đổi hoàn toàn cách chúng ta tiếp cận sách. Tại Việt Nam, thị trường AudioBook tăng trưởng 40% mỗi năm.</p>',
        excerpt: 'AudioBook đang trở thành xu hướng mới, thay đổi cách chúng ta tiếp cận sách.',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
        category: 'Tin Tức Xuất Bản',
        tags: ['audiobook', 'xu hướng', 'xuất bản'],
        author: admin._id,
        views: 650
      },
      {
        title: 'Hội sách quốc tế TP.HCM 2026: Quy mô lớn nhất từ trước đến nay',
        content: '<p>Hội sách quốc tế TP.HCM 2026 quy tụ hơn 500 gian hàng từ 200 nhà xuất bản trong và ngoài nước, với hơn 300.000 đầu sách.</p>',
        excerpt: 'Sự kiện sách lớn nhất năm với hàng nghìn ưu đãi hấp dẫn.',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        category: 'Sự Kiện',
        tags: ['hội sách', 'sự kiện', 'TP.HCM'],
        author: admin._id,
        views: 2100
      }
    ]);

    console.log('Blogs seeded!');

    // ====== COUPONS ======
    await Coupon.create([
      {
        code: 'WELCOME20',
        description: 'Giảm 20% cho thành viên mới',
        discountType: 'percent',
        discountValue: 20,
        minOrderAmount: 100000,
        maxDiscount: 50000,
        usageLimit: 1000,
        usedCount: 156,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2025-12-31')
      },
      {
        code: 'FREESHIP',
        description: 'Miễn phí vận chuyển',
        discountType: 'fixed',
        discountValue: 19000,
        minOrderAmount: 200000,
        usageLimit: 500,
        usedCount: 89,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2025-12-31')
      },
      {
        code: 'SALE50K',
        description: 'Giảm 50.000đ cho đơn từ 300.000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderAmount: 300000,
        usageLimit: 200,
        usedCount: 45,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2025-12-31')
      },
      {
        code: 'SACHHAY10',
        description: 'Giảm 10% không giới hạn',
        discountType: 'percent',
        discountValue: 10,
        minOrderAmount: 50000,
        usageLimit: 0,
        usedCount: 320,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2025-06-30')
      }
    ]);

    console.log('Coupons seeded!');

    // ====== NOTIFICATIONS ======
    await Notification.create([
      {
        title: 'Chào mừng đến với Sách Hub!',
        content: 'Cảm ơn bạn đã trở thành thành viên của Sách Hub. Khám phá hàng ngàn đầu sách hay với ưu đãi hấp dẫn ngay hôm nay!',
        type: 'general',
        link: '/',
        isGlobal: true,
        user: null
      },
      {
        title: 'Khuyến mãi tháng 4: Giảm đến 50%',
        content: 'Hàng ngàn đầu sách đang được giảm giá lên đến 50%. Sử dụng mã WELCOME20 để được giảm thêm 20% cho đơn hàng đầu tiên.',
        type: 'promotion',
        link: '/pages/danh-sach-sach.html',
        isGlobal: true,
        user: null
      },
      {
        title: 'Thông báo bảo trì hệ thống',
        content: 'Hệ thống Sách Hub sẽ tạm ngưng phục vụ từ 23:00 ngày 10/04 đến 01:00 ngày 11/04 để nâng cấp. Mong quý khách thông cảm.',
        type: 'system',
        link: '',
        isGlobal: true,
        user: null
      },
      {
        title: 'Đơn hàng của bạn đã được xác nhận',
        content: 'Đơn hàng #SH123456 của bạn đã được xác nhận và đang chuẩn bị giao. Cảm ơn bạn đã mua sắm tại Sách Hub!',
        type: 'order',
        link: '/pages/don-hang.html',
        isGlobal: false,
        user: user1._id
      },
      {
        title: 'Bạn nhận được 100 điểm thưởng',
        content: 'Bạn vừa nhận được 100 điểm thưởng từ đơn hàng gần nhất. Tích lũy điểm để đổi quà hấp dẫn nhé!',
        type: 'general',
        link: '/pages/ho-so.html',
        isGlobal: false,
        user: user1._id
      }
    ]);

    console.log('Notifications seeded!');

    // ====== JOBS ======
    const inDays = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d;
    };

    await Job.create([
      {
        title: 'Senior Fullstack Developer (Node.js, React)',
        department: 'Công nghệ',
        location: 'TP. Hồ Chí Minh',
        jobType: 'Toàn thời gian',
        salary: '25 - 40 triệu',
        experience: '3-5 năm',
        quantity: 2,
        deadline: inDays(45),
        description: 'Sách Hub đang tìm kiếm một Senior Fullstack Developer có kinh nghiệm để tham gia phát triển và mở rộng nền tảng thương mại điện tử sách hàng đầu Việt Nam. Bạn sẽ làm việc trực tiếp với CTO và đội ngũ sản phẩm để xây dựng các tính năng mới, tối ưu hiệu năng và đảm bảo chất lượng mã nguồn.',
        requirements: 'Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương\nTối thiểu 3 năm kinh nghiệm với Node.js, Express, MongoDB\nThành thạo React.js, HTML5, CSS3, JavaScript ES6+\nKinh nghiệm thiết kế RESTful API và tối ưu cơ sở dữ liệu\nHiểu biết về Docker, CI/CD, AWS là một lợi thế\nKỹ năng phân tích, giải quyết vấn đề tốt\nCó khả năng làm việc nhóm và giao tiếp hiệu quả',
        benefits: 'Mức lương cạnh tranh từ 25-40 triệu, review lương 2 lần/năm\nThưởng dự án, thưởng cuối năm tháng 13-14\nBảo hiểm sức khỏe Bảo Việt cho nhân viên và người thân\nMacBook Pro hỗ trợ làm việc\nMôi trường trẻ trung, năng động, ưu tiên ý tưởng sáng tạo\n12 ngày phép năm + ngày sinh nhật được nghỉ\nLương tháng 13, du lịch công ty hằng năm',
        isActive: true
      },
      {
        title: 'Chuyên viên Marketing Content',
        department: 'Marketing',
        location: 'TP. Hồ Chí Minh',
        jobType: 'Toàn thời gian',
        salary: '12 - 18 triệu',
        experience: '1-3 năm',
        quantity: 1,
        deadline: inDays(30),
        description: 'Chúng tôi tìm kiếm một Chuyên viên Marketing Content đam mê sách và viết lách để xây dựng nội dung truyền thông cho Sách Hub trên các kênh website, social media và email marketing. Bạn sẽ là người kể chuyện về các đầu sách, tác giả và truyền cảm hứng đọc sách cho cộng đồng.',
        requirements: 'Tốt nghiệp Cao đẳng/Đại học chuyên ngành Marketing, Báo chí, Văn học\nCó tối thiểu 1 năm kinh nghiệm viết content marketing\nKhả năng viết tốt tiếng Việt, văn phong linh hoạt theo từng chủ đề\nĐam mê đọc sách, có kiến thức về văn học là một lợi thế\nThành thạo các công cụ SEO, Google Analytics\nBiết sử dụng Canva, Photoshop cơ bản',
        benefits: 'Lương 12-18 triệu + thưởng hiệu suất hằng tháng\nBHXH, BHYT, BHTN đầy đủ\nĐược tặng sách miễn phí mỗi tháng\nMôi trường yêu sách, đồng nghiệp thân thiện\nCơ hội tham gia các sự kiện sách lớn của ngành',
        isActive: true
      },
      {
        title: 'Nhân viên Kho',
        department: 'Vận hành',
        location: 'TP. Hồ Chí Minh',
        jobType: 'Toàn thời gian',
        salary: '8 - 11 triệu',
        experience: 'Không yêu cầu',
        quantity: 5,
        deadline: inDays(20),
        description: 'Sách Hub tuyển nhân viên kho làm việc tại kho hàng quận Bình Tân, TP. HCM. Công việc chính là sắp xếp, kiểm kê, đóng gói và xuất hàng cho đơn hàng online của khách. Đây là vị trí phù hợp với các bạn chăm chỉ, cẩn thận và muốn có thu nhập ổn định.',
        requirements: 'Tốt nghiệp THPT trở lên\nSức khỏe tốt, chịu được áp lực công việc\nCẩn thận, trung thực, có tinh thần trách nhiệm\nCó kinh nghiệm làm kho, đóng gói là một lợi thế\nƯu tiên ứng viên ở quận Bình Tân, Tân Phú, Bình Chánh',
        benefits: 'Lương cứng 8-11 triệu + thưởng KPI\nĂn trưa miễn phí tại công ty\nBHXH, BHYT, BHTN theo quy định\nThưởng lễ, Tết theo doanh thu công ty\nMôi trường làm việc thân thiện, có lộ trình thăng tiến lên Tổ trưởng, Trưởng kho',
        isActive: true
      },
      {
        title: 'Chuyên viên Chăm sóc Khách hàng',
        department: 'CSKH',
        location: 'TP. Hồ Chí Minh',
        jobType: 'Toàn thời gian',
        salary: '9 - 13 triệu',
        experience: '1-2 năm',
        quantity: 3,
        deadline: inDays(25),
        description: 'Sách Hub đang tìm kiếm các bạn Chuyên viên CSKH năng động, nhiệt tình để hỗ trợ và tư vấn cho khách hàng qua các kênh hotline, livechat, email và mạng xã hội. Bạn sẽ là cầu nối giúp khách hàng có trải nghiệm mua sắm tuyệt vời tại Sách Hub.',
        requirements: 'Tốt nghiệp Cao đẳng/Đại học các ngành liên quan\nCó tối thiểu 1 năm kinh nghiệm CSKH/Telesales\nGiọng nói rõ ràng, dễ nghe, giao tiếp tốt\nKỹ năng xử lý tình huống và giải quyết khiếu nại tốt\nThành thạo tin học văn phòng, gõ phím nhanh\nCó tinh thần phục vụ khách hàng và yêu thích sách',
        benefits: 'Lương 9-13 triệu + thưởng KPI hằng tháng\nĐược đào tạo nghiệp vụ CSKH chuyên nghiệp\nBHXH, BHYT, BHTN đầy đủ\nMôi trường làm việc trẻ trung, năng động\nCơ hội thăng tiến lên Trưởng nhóm, Trưởng bộ phận CSKH',
        isActive: true
      },
      {
        title: 'Thực tập sinh Phân tích Dữ liệu',
        department: 'Công nghệ',
        location: 'TP. Hồ Chí Minh',
        jobType: 'Thực tập',
        salary: '4 - 6 triệu',
        experience: 'Sinh viên năm 3-4',
        quantity: 2,
        deadline: inDays(40),
        description: 'Cơ hội thực tập tuyệt vời dành cho sinh viên năm 3-4 các trường đại học có đam mê về dữ liệu. Bạn sẽ tham gia phân tích hành vi mua sắm của khách hàng, xây dựng dashboard báo cáo và hỗ trợ team Marketing đưa ra các quyết định dựa trên dữ liệu.',
        requirements: 'Sinh viên năm 3-4 các ngành Khoa học Dữ liệu, CNTT, Toán Tin, Thống kê\nCó kiến thức cơ bản về SQL, Python (Pandas, Numpy)\nBiết sử dụng các công cụ trực quan hóa: Power BI, Tableau, Google Data Studio\nTư duy logic, khả năng phân tích tốt\nChịu khó học hỏi, có thể làm fulltime tối thiểu 3 tháng\nCó thể đi làm ít nhất 4 buổi/tuần',
        benefits: 'Trợ cấp 4-6 triệu/tháng tùy năng lực\nĐược mentoring trực tiếp bởi Senior Data Analyst\nĐược tham gia các dự án thực tế của công ty\nCó cơ hội trở thành nhân viên chính thức sau thực tập\nXác nhận thực tập, hỗ trợ làm khóa luận tốt nghiệp\nMôi trường trẻ, được tặng sách miễn phí',
        isActive: true
      }
    ]);

    console.log('Jobs seeded!');

    console.log('\n========================================');
    console.log('SEED DATA HOÀN TẤT!');
    console.log('========================================');
    console.log('Admin: admin@sachhub.vn / admin123');
    console.log('Staff: staff@sachhub.vn / staff123');
    console.log('User:  user@sachhub.vn / user123');
    console.log(`Danh mục: ${categories.length}`);
    console.log(`Sách: ${books.length}`);
    console.log(`Đơn hàng: ${orderDefs.length} (5 delivered, 3 shipping, 2 confirmed, 2 pending, 1 cancelled)`);
    console.log('Blog: 4 bài viết');
    console.log('Coupon: 4 mã (WELCOME20, FREESHIP, SALE50K, SACHHAY10)');
    console.log('Tuyển dụng: 5 vị trí');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

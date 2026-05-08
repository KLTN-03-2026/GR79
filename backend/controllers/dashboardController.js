const Order = require('../models/Order');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');

// Admin: Lấy thống kê dashboard
const getStats = async (req, res) => {
  try {
    // Tổng doanh thu (chỉ tính đơn delivered)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Tổng đơn hàng
    const totalOrders = await Order.countDocuments();

    // Đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Tổng users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Tổng sách
    const totalBooks = await Book.countDocuments();

    // Top 10 sách bán chạy nhất
    const bestSellingBooks = await Book.find({ sold: { $gt: 0 } })
      .select('title images price sold')
      .sort({ sold: -1 })
      .limit(10);

    // 10 đơn hàng gần đây
    const recentOrders = await Order.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Doanh thu theo period (mặc định 7 ngày, có thể là 30 ngày)
    const period = req.query.period === 'month' ? 'month' : 'week';
    const days = period === 'month' ? 30 : 7;

    // Dùng múi giờ Việt Nam ổn định cho cả query lẫn loop để key ngày match nhau
    const TZ = 'Asia/Ho_Chi_Minh';
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const fmtDateVN = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD theo giờ VN

    // Tính start date = đầu ngày VN của (hôm nay - (days-1)) tính theo giờ VN
    const todayStrVN = fmtDateVN(new Date());
    const todayMidnightVN = new Date(`${todayStrVN}T00:00:00+07:00`);
    const startDate = new Date(todayMidnightVN.getTime() - (days - 1) * ONE_DAY);

    // Tính cả pending + confirmed + shipping + delivered để dashboard có dữ liệu sớm
    const revenueByDay = await Order.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'confirmed', 'shipping', 'delivered'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Điền các ngày không có doanh thu - dùng cùng format YYYY-MM-DD theo giờ VN
    const weeklyRevenue = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * ONE_DAY);
      const dateStr = fmtDateVN(d);

      const found = revenueByDay.find(r => r._id === dateStr);
      weeklyRevenue.push({
        date: dateStr,
        revenue: found ? found.revenue : 0,
        orders: found ? found.count : 0
      });
    }

    // Thống kê số sách đã bán theo danh mục (thời gian thực)
    const categorySales = await Book.aggregate([
      { $match: { isActive: true, sold: { $gt: 0 } } },
      {
        $group: {
          _id: '$category',
          totalSold: { $sum: '$sold' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Populate tên danh mục
    const categoryIds = categorySales.map(c => c._id).filter(Boolean);
    const categoryDocs = await Category.find({ _id: { $in: categoryIds } }).select('name');
    const categoryMap = {};
    categoryDocs.forEach(c => { categoryMap[c._id.toString()] = c.name; });

    const chartColors = ['#E8491D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];
    const categoryChart = {
      labels: categorySales.map(c => categoryMap[c._id?.toString()] || 'Khác'),
      data: categorySales.map(c => c.totalSold),
      colors: chartColors.slice(0, categorySales.length)
    };

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalUsers,
        totalBooks,
        bestSellingBooks,
        recentOrders,
        weeklyRevenue,
        categoryChart
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };

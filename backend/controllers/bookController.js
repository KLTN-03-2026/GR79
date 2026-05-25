const Book = require('../models/Book');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

// @desc    Lấy danh sách sách (có filter, sort, pagination)
// @route   GET /api/books
const getBooks = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort, rating, status, page = 1, limit = 12 } = req.query;

    // Build filter
    const filter = { isActive: true };

    // Loc theo trang thai ton kho
    if (status === 'in-stock' || status === 'in_stock') {
      filter.stock = { $gt: 0 };
    } else if (status === 'out-of-stock' || status === 'out_of_stock') {
      filter.stock = 0;
    }

    if (category) {
      // Hỗ trợ cả ObjectId và slug
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
        else filter.category = null; // Không tìm thấy → trả 0 kết quả
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // Build sort - hỗ trợ cả format frontend và backend
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc' || sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price_desc' || sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'best_selling' || sort === 'best-selling' || sort === '-sold') sortOption = { sold: -1 };
    else if (sort === 'rating' || sort === '-rating') sortOption = { rating: -1 };
    else if (sort === 'name_asc' || sort === 'name-asc') sortOption = { title: 1 };
    else if (sort === 'name_desc' || sort === 'name-desc') sortOption = { title: -1 };
    else if (sort === 'newest' || sort === '-createdAt') sortOption = { createdAt: -1 };
    else if (sort === 'oldest' || sort === 'createdAt') sortOption = { createdAt: 1 };

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Book.countDocuments(filter)
    ]);

    res.json({
      success: true,
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết sách theo slug
// @route   GET /api/books/:slug
const getBookBySlug = async (req, res) => {
  try {
    const param = req.params.slug;
    // Hỗ trợ cả ObjectId và slug
    const query = param.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: param, isActive: true }
      : { slug: param, isActive: true };

    const book = await Book.findOne(query).populate('category', 'name slug');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Tạo sách mới
// @route   POST /api/books
const createBook = async (req, res) => {
  try {
    const {
      title, author, publisher, category, description,
      price, originalPrice, discount, stock, pages,
      publishYear, language, isFeatured, isFlashSale
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên sách' });
    }

    // Chặn trùng tên sách (case-insensitive, chỉ xét sách đang hoạt động)
    const existing = await Book.findOne({
      title: { $regex: `^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      isActive: { $ne: false }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên sách đã tồn tại' });
    }

    // Lấy URLs ảnh từ Cloudinary upload
    const images = req.files ? req.files.map(file => file.path) : [];

    const book = await Book.create({
      title,
      author,
      publisher,
      category,
      description,
      price,
      originalPrice,
      discount,
      images,
      stock,
      pages,
      publishYear,
      language,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isFlashSale: isFlashSale === 'true' || isFlashSale === true
    });

    await book.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Tạo sách thành công',
      book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật sách
// @route   PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    const {
      title, author, publisher, category, description,
      price, originalPrice, discount, stock, pages,
      publishYear, language, isFeatured, isFlashSale, existingImages
    } = req.body;

    // Check trùng tên (trừ chính nó)
    if (title !== undefined && title.trim() && title.trim() !== book.title) {
      const existing = await Book.findOne({
        _id: { $ne: book._id },
        title: { $regex: `^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        isActive: { $ne: false }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tên sách đã tồn tại' });
      }
    }

    // Cập nhật các trường
    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (publisher !== undefined) book.publisher = publisher;
    if (category !== undefined) book.category = category;
    if (description !== undefined) book.description = description;
    if (price !== undefined) book.price = price;
    if (originalPrice !== undefined) book.originalPrice = originalPrice;
    if (discount !== undefined) book.discount = discount;
    if (stock !== undefined) book.stock = stock;
    if (pages !== undefined) book.pages = pages;
    if (publishYear !== undefined) book.publishYear = publishYear;
    if (language !== undefined) book.language = language;
    if (isFeatured !== undefined) book.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isFlashSale !== undefined) book.isFlashSale = isFlashSale === 'true' || isFlashSale === true;

    // Handle images
    // existingImages: mảng URL ảnh cũ user còn giữ lại (FE luôn gửi field này khi PUT,
    // có thể là chuỗi rỗng "" để báo đã xóa hết)
    const existingArr = existingImages === undefined
      ? null
      : (Array.isArray(existingImages) ? existingImages : [existingImages]).filter(u => u && u.trim());
    let updatedImages = existingArr || [];

    // Thêm ảnh mới nếu có upload
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updatedImages = [...updatedImages, ...newImages];
    }

    // Chỉ cập nhật images nếu FE có ý định cập nhật (gửi existingImages hoặc upload thêm)
    if (existingImages !== undefined || (req.files && req.files.length > 0)) {
      // Xóa ảnh cũ trên Cloudinary nếu không còn giữ
      const removedImages = book.images.filter(img => !updatedImages.includes(img));
      for (const img of removedImages) {
        try {
          const publicId = img.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // Bỏ qua lỗi xóa ảnh
        }
      }

      book.images = updatedImages;
    }

    await book.save();
    await book.populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Cập nhật sách thành công',
      book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa sách (soft delete)
// @route   DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    book.isActive = false;
    await book.save();

    res.json({
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy sách flash sale
// @route   GET /api/books/flash-sale
const getFlashSaleBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const books = await Book.find({ isFlashSale: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ discount: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy sách nổi bật
// @route   GET /api/books/featured
const getFeaturedBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const books = await Book.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

module.exports = {
  getBooks,
  getBookBySlug,
  createBook,
  updateBook,
  deleteBook,
  getFlashSaleBooks,
  getFeaturedBooks
};

const Category = require('../models/Category');
const Book = require('../models/Book');

// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const hasPagination = req.query.page !== undefined;
    const filter = req.query.all === 'true' ? {} : { isActive: true };

    let query = Category.find(filter).sort({ name: 1 });
    let total = 0;
    let page = 1;
    let limit = 0;

    if (hasPagination) {
      page = parseInt(req.query.page) || 1;
      limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      total = await Category.countDocuments(filter);
      query = query.skip(skip).limit(limit);
    }

    const categories = await query;

    // Đếm số sách trong mỗi danh mục
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const bookCount = await Book.countDocuments({ category: cat._id, isActive: true });
        return {
          ...cat.toObject(),
          bookCount
        };
      })
    );

    const response = {
      success: true,
      categories: categoriesWithCount
    };

    if (hasPagination) {
      response.pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy danh mục theo slug
// @route   GET /api/categories/:slug
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Tạo danh mục mới
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên danh mục'
      });
    }

    // Check trùng tên
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }

    const payload = { name: name.trim(), description, image };
    if (isActive !== undefined) payload.isActive = isActive === 'true' || isActive === true;

    const category = await Category.create(payload);

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check trùng tên (trừ chính nó)
    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    await category.save();

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa danh mục (soft delete)
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Kiểm tra xem có sách nào thuộc danh mục này không
    const bookCount = await Book.countDocuments({ category: category._id, isActive: true });
    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục đang có ${bookCount} sách. Vui lòng chuyển sách sang danh mục khác trước.`
      });
    }

    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
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
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};

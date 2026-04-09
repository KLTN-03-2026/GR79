const Blog = require('../models/Blog');

// Lấy danh sách bài viết (public)
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.all !== 'true') {
      filter.isPublished = true;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort === '-views') sortOption = { views: -1 };
    else if (req.query.sort === '-createdAt') sortOption = { createdAt: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'fullName avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy bài viết theo slug (public, tăng views)
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'fullName avatar');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Tạo bài viết
const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, isPublished } = req.body;

    const blogData = {
      title,
      content,
      excerpt,
      category,
      author: req.user._id,
      isPublished: isPublished !== undefined ? isPublished : true
    };

    if (tags) {
      blogData.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    if (req.file) {
      blogData.image = req.file.path;
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({ success: true, message: 'Tạo bài viết thành công', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Cập nhật bài viết
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const { title, content, excerpt, category, tags, isPublished } = req.body;

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (category) blog.category = category;
    if (isPublished !== undefined) blog.isPublished = isPublished;

    if (tags) {
      blog.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    if (req.file) {
      blog.image = req.file.path;
    }

    await blog.save();

    res.json({ success: true, message: 'Cập nhật bài viết thành công', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Xóa bài viết
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    res.json({ success: true, message: 'Xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };

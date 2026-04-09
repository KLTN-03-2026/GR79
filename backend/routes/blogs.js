const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', protect, adminOnly, upload.single('image'), createBlog);
router.put('/:id', protect, adminOnly, upload.single('image'), updateBlog);
router.delete('/:id', protect, adminOnly, deleteBlog);

module.exports = router;

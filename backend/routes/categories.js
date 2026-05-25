const express = require('express');
const router = express.Router();
const { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, staffOrAdmin } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, staffOrAdmin, upload.single('image'), createCategory);
router.put('/:id', protect, staffOrAdmin, upload.single('image'), updateCategory);
router.delete('/:id', protect, staffOrAdmin, deleteCategory);

module.exports = router;

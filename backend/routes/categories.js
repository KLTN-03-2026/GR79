const express = require('express');
const router = express.Router();
const { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, staffOrAdmin } = require('../middlewares/auth');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, staffOrAdmin, createCategory);
router.put('/:id', protect, staffOrAdmin, updateCategory);
router.delete('/:id', protect, staffOrAdmin, deleteCategory);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getBooks, getBookBySlug, createBook, updateBook, deleteBook, getFlashSaleBooks, getFeaturedBooks } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getBooks);
router.get('/flash-sale', getFlashSaleBooks);
router.get('/featured', getFeaturedBooks);
router.get('/:slug', getBookBySlug);
router.post('/', protect, adminOnly, upload.array('images', 5), createBook);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;

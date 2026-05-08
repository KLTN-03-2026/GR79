const express = require('express');
const router = express.Router();
const { getBooks, getBookBySlug, createBook, updateBook, deleteBook, getFlashSaleBooks, getFeaturedBooks } = require('../controllers/bookController');
const { protect, staffOrAdmin } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getBooks);
router.get('/flash-sale', getFlashSaleBooks);
router.get('/featured', getFeaturedBooks);
router.get('/:slug', getBookBySlug);
router.post('/', protect, staffOrAdmin, upload.array('images', 5), createBook);
router.put('/:id', protect, staffOrAdmin, upload.array('images', 5), updateBook);
router.delete('/:id', protect, staffOrAdmin, deleteBook);

module.exports = router;

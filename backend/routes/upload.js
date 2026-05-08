const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.post('/', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file để upload' });
    }

    res.json({
      success: true,
      message: 'Upload thành công',
      data: {
        url: req.file.path,
        filename: req.file.filename
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

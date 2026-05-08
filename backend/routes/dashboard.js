const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middlewares/auth');
const { getStats } = require('../controllers/dashboardController');

router.get('/stats', protect, staffOrAdmin, getStats);

module.exports = router;

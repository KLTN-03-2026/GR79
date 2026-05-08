const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/', protect, ctrl.getMyNotifications);
router.get('/unread-count', protect, ctrl.getUnreadCount);
router.put('/read-all', protect, ctrl.markAllAsRead);
router.put('/:id/read', protect, ctrl.markAsRead);
router.get('/admin/all', protect, adminOnly, ctrl.getAllNotifications);
router.post('/', protect, adminOnly, ctrl.createNotification);
router.delete('/:id', protect, adminOnly, ctrl.deleteNotification);

module.exports = router;

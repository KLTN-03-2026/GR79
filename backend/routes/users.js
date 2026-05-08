const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  toggleUserActive,
  createStaffAccount,
  changeUserRole
} = require('../controllers/userController');

router.get('/', protect, adminOnly, getAllUsers);
router.post('/create-staff', protect, adminOnly, createStaffAccount);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id/toggle-active', protect, adminOnly, toggleUserActive);
router.put('/:id/role', protect, adminOnly, changeUserRole);

module.exports = router;

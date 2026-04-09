const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth');
const {
  createContact,
  getAllContacts,
  updateContactStatus
} = require('../controllers/contactController');

router.post('/', createContact);
router.get('/', protect, adminOnly, getAllContacts);
router.put('/:id/status', protect, adminOnly, updateContactStatus);

module.exports = router;

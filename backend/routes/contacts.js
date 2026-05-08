const express = require('express');
const router = express.Router();
const { protect, staffOrAdmin } = require('../middlewares/auth');
const {
  createContact,
  getAllContacts,
  updateContactStatus
} = require('../controllers/contactController');

router.post('/', createContact);
router.get('/', protect, staffOrAdmin, getAllContacts);
router.put('/:id/status', protect, staffOrAdmin, updateContactStatus);

module.exports = router;

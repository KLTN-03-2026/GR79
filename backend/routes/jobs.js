const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/', ctrl.getJobs);
router.get('/:slug', ctrl.getJobBySlug);
router.post('/', protect, adminOnly, ctrl.createJob);
router.put('/:id', protect, adminOnly, ctrl.updateJob);
router.delete('/:id', protect, adminOnly, ctrl.deleteJob);

module.exports = router;

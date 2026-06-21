const express = require('express');
const router = express.Router();
const ac = require('../controllers/admissionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', ac.createAdmission);
router.get('/', restrictTo('admin', 'teacher'), ac.getAdmissions);
router.put('/:id/approve', restrictTo('admin'), ac.approveAdmission);
router.put('/:id/reject', restrictTo('admin'), ac.rejectAdmission);

module.exports = router;

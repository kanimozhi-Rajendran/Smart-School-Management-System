const express = require('express');
const router = express.Router();
const ac = require('../controllers/assignmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// Teacher routes
router.get('/teacher', restrictTo('teacher'), ac.getAssignments);
router.post('/teacher', restrictTo('teacher'), ac.createAssignment);
router.put('/teacher/:id', restrictTo('teacher'), ac.updateAssignment);
router.delete('/teacher/:id', restrictTo('teacher'), ac.deleteAssignment);
router.get('/teacher/:assignmentId/submissions', restrictTo('teacher'), ac.getSubmissions);
router.put('/teacher/submission/:submissionId/grade', restrictTo('teacher'), ac.gradeSubmission);

// Student routes
router.get('/student', restrictTo('student'), ac.getStudentAssignments);

// Admin routes
router.get('/admin', restrictTo('admin'), ac.getAllAssignments);

module.exports = router;

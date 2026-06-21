const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('student'));

router.get('/dashboard', studentController.getDashboard);
router.get('/profile', studentController.getProfile);
router.get('/attendance', studentController.getAttendance);
router.get('/marks', studentController.getMarks);
router.get('/timetable', studentController.getTimetable);
router.post('/leave', studentController.submitLeave);
router.get('/leave', studentController.getLeaves);
router.post('/complaints', studentController.raiseComplaint);
router.get('/complaints', studentController.getComplaints);
router.get('/notifications', studentController.getNotifications);
router.patch('/notifications/read/:notifId', studentController.markNotificationRead);
router.get('/fees', studentController.getFees);
router.get('/assignments', require('../controllers/assignmentController').getStudentAssignments);

module.exports = router;

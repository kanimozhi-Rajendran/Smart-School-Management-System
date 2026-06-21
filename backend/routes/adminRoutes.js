const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes under admin endpoint
router.use(protect);
router.use(restrictTo('admin'));

// Stats
router.get('/stats', adminController.getStats);

// Student CRUD
router.get('/students', adminController.getStudents);
router.post('/students', adminController.addStudent);
router.put('/students/:id', adminController.editStudent);
router.delete('/students/:id', adminController.deleteStudent);

// Teacher CRUD
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.addTeacher);
router.put('/teachers/:id', adminController.editTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// Attendance Unlock and Sheet
router.get('/attendance', adminController.getAttendanceSheet);
router.put('/attendance/unlock/:id', adminController.unlockAttendance);

// Marks Sheet and Edit
router.get('/marks', adminController.getMarksSheet);
router.post('/marks', adminController.saveMarks);

// Timetable
router.get('/timetable', adminController.getFullTimetable);
router.post('/timetable', adminController.saveTimetableSlot);

// Complaints View and Reply
router.get('/complaints', adminController.getComplaints);
router.put('/complaints/:id', adminController.replyComplaint);

// Notifications Broadcast
router.post('/notifications', adminController.addNotification);

// Metadata lookup
router.get('/classes', adminController.getClasses);
router.get('/sections', adminController.getSections);
router.get('/subjects', adminController.getSubjects);

// Excel Operations
router.get('/excel/export/students', adminController.exportStudents);
router.get('/excel/export/attendance', adminController.exportAttendance);
router.get('/excel/export/marks', adminController.exportMarks);
router.get('/excel/export/complaints', adminController.exportComplaints);
router.post('/excel/import/students', adminController.importStudents);

// Faculty
router.get('/faculty', adminController.getFaculty);
router.put('/faculty/:id', adminController.updateFaculty);

// Enhanced stats
router.get('/enhanced-stats', adminController.getEnhancedStats);

module.exports = router;

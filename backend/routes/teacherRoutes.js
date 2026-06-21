const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes under teacher endpoint
router.use(protect);
router.use(restrictTo('teacher'));

// Student CRUD in Teacher Dashboard
router.get('/students', teacherController.getStudents);
router.get('/students/:id', teacherController.getStudentById);
router.post('/students', teacherController.addStudent);
router.put('/students/:id', teacherController.editStudent);
router.delete('/students/:id', teacherController.deleteStudent);

// Attendance marking and search
router.get('/attendance', teacherController.getAttendanceList);
router.post('/attendance', teacherController.saveAttendance);

// Marks entry and search
router.get('/marks', teacherController.getMarksList);
router.post('/marks', teacherController.saveMarks);

// Personal timetable
router.get('/timetable', teacherController.getTimetable);

module.exports = router;

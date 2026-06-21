const express = require('express');
const router = express.Router();
const pc = require('../controllers/parentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('admin', 'teacher'));

router.get('/',                          pc.getParents);
router.get('/student/:studentId',        pc.getParentByStudent);
router.get('/messages/:studentId',       pc.getMessages);
router.post('/messages',                 pc.sendMessage);
router.post('/broadcast',               pc.broadcastMessage);
router.post('/meetings',                 pc.scheduleMeeting);
router.get('/meetings',                  pc.getMeetings);
router.post('/alert',                    pc.sendAlert);

module.exports = router;

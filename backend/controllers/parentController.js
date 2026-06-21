const pool = require('../config/db');

// ── Get all parents with student info ─────────────────────
exports.getParents = async (req, res) => {
  const { search, class_id, section_id } = req.query;
  try {
    let q = `
      SELECT p.*, st.name as student_name, st.register_number, st.class_id, st.section_id,
             c.class_name, sec.section_name,
             COALESCE(unread.cnt,0) as unread_count
      FROM parents p
      JOIN students st ON p.student_id = st.id
      LEFT JOIN classes c ON st.class_id = c.id
      LEFT JOIN sections sec ON st.section_id = sec.id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as cnt FROM parent_messages WHERE is_read=0 GROUP BY student_id
      ) unread ON unread.student_id = st.id
      WHERE 1=1`;
    const params = [];
    if (search) {
      q += ' AND (st.name LIKE ? OR p.father_name LIKE ? OR p.mother_name LIKE ? OR st.register_number LIKE ? OR p.father_phone LIKE ?)';
      params.push(...Array(5).fill(`%${search}%`));
    }
    if (class_id)   { q += ' AND st.class_id = ?';   params.push(class_id); }
    if (section_id) { q += ' AND st.section_id = ?'; params.push(section_id); }
    q += ' ORDER BY st.name';
    const [rows] = await pool.query(q, params);
    return res.status(200).json({ parents: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Get parent detail with student summary ────────────────
exports.getParentByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const [[parent]] = await pool.query(
      `SELECT p.*, st.name as student_name, st.register_number, st.dob, st.gender,
              c.class_name, sec.section_name
       FROM parents p
       JOIN students st ON p.student_id = st.id
       LEFT JOIN classes c ON st.class_id = c.id
       LEFT JOIN sections sec ON st.section_id = sec.id
       WHERE p.student_id = ?`, [studentId]
    );
    if (!parent) return res.status(404).json({ message: 'Parent record not found' });

    const [[attStats]] = await pool.query(
      `SELECT COUNT(*) as total, SUM(status='Present') as present, SUM(status='Absent') as absent
       FROM attendance WHERE student_id = ?`, [studentId]
    );
    const [marks] = await pool.query(
      `SELECT sub.subject_name, m.marks_obtained FROM marks m JOIN subjects sub ON m.subject_id = sub.id WHERE m.student_id = ?`,
      [studentId]
    );
    const [[feeStats]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) as total, COALESCE(SUM(paid_amount),0) as paid FROM fees WHERE student_id = ?`,
      [studentId]
    );
    return res.status(200).json({ parent, attendance: attStats, marks, fees: feeStats });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Get chat messages for a student (conversation) ────────
exports.getMessages = async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, 
        CASE WHEN pm.sender_role='teacher' THEN t.name
             WHEN pm.sender_role='admin'   THEN a.name
             ELSE 'Unknown' END as sender_name
       FROM parent_messages pm
       LEFT JOIN teachers t ON pm.sender_id = t.id AND pm.sender_role='teacher'
       LEFT JOIN admins a   ON pm.sender_id = a.id AND pm.sender_role='admin'
       WHERE pm.student_id = ?
       ORDER BY pm.created_at ASC`,
      [studentId]
    );
    // Mark as read
    await pool.query('UPDATE parent_messages SET is_read=1 WHERE student_id=?', [studentId]);
    return res.status(200).json({ messages: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Send a message to a parent (about a student) ──────────
exports.sendMessage = async (req, res) => {
  const senderId = req.user.refId;
  const senderRole = req.user.role;
  const { student_id, content, message_type } = req.body;

  if (!student_id || !content) return res.status(400).json({ message: 'student_id and content required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO parent_messages (sender_id, sender_role, student_id, message_type, content) VALUES (?, ?, ?, ?, ?)',
      [senderId, senderRole, student_id, message_type || 'text', content]
    );

    // Also create a student notification
    const typeLabels = {
      fee_reminder: 'Fee Reminder', attendance_alert: 'Attendance Alert',
      marks_alert: 'Marks Alert', meeting_reminder: 'Meeting Reminder',
      homework: 'Homework', exam_notice: 'Exam Notice',
      assignment: 'New Assignment', circular: 'School Circular',
    };
    const notifTitle = typeLabels[message_type] || 'Message from Teacher';
    await pool.query(
      'INSERT INTO notifications (title, message, role, category) VALUES (?, ?, ?, ?)',
      [notifTitle, content.substring(0, 200), 'student', message_type || 'general']
    );

    return res.status(201).json({ message: 'Sent', id: result.insertId });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Broadcast message to entire class/section ─────────────
exports.broadcastMessage = async (req, res) => {
  const senderId = req.user.refId;
  const senderRole = req.user.role;
  const { class_id, section_id, student_ids, title, content, message_type } = req.body;

  if (!content) return res.status(400).json({ message: 'Content required' });

  try {
    // Save broadcast record
    await pool.query(
      'INSERT INTO parent_broadcasts (sender_id, sender_role, class_id, section_id, title, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [senderId, senderRole, class_id || null, section_id || null, title || 'Broadcast', content, message_type || 'general']
    );

    // Determine target students
    let targetStudents = student_ids || [];
    if (targetStudents.length === 0 && class_id) {
      let q = 'SELECT id FROM students WHERE class_id = ?';
      const params = [class_id];
      if (section_id) { q += ' AND section_id = ?'; params.push(section_id); }
      const [rows] = await pool.query(q, params);
      targetStudents = rows.map(r => r.id);
    }

    // Send individual messages
    for (const sid of targetStudents) {
      await pool.query(
        'INSERT INTO parent_messages (sender_id, sender_role, student_id, message_type, content) VALUES (?, ?, ?, ?, ?)',
        [senderId, senderRole, sid, message_type || 'text', content]
      );
    }

    // Notification
    await pool.query(
      'INSERT INTO notifications (title, message, role, category) VALUES (?, ?, ?, ?)',
      [title || 'Broadcast Message', content.substring(0, 200), 'student', 'General']
    );

    return res.status(201).json({ message: `Broadcast sent to ${targetStudents.length} students` });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Schedule parent meeting ───────────────────────────────
exports.scheduleMeeting = async (req, res) => {
  const { student_id, meeting_date, meeting_time, purpose, mode } = req.body;
  const teacherId = req.user.refId;
  if (!student_id || !meeting_date || !meeting_time) return res.status(400).json({ message: 'Required fields missing' });
  try {
    await pool.query(
      'INSERT INTO parent_meetings (student_id, teacher_id, meeting_date, meeting_time, purpose, mode) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, teacherId, meeting_date, meeting_time, purpose, mode || 'Offline']
    );
    // Auto-send meeting reminder message
    await pool.query(
      'INSERT INTO parent_messages (sender_id, sender_role, student_id, message_type, content) VALUES (?, ?, ?, ?, ?)',
      [teacherId, 'teacher', student_id, 'meeting_reminder', `📅 Parent-Teacher Meeting scheduled on ${meeting_date} at ${meeting_time}. Purpose: ${purpose || 'General discussion'}. Mode: ${mode || 'Offline'}`]
    );
    await pool.query(
      'INSERT INTO notifications (title, message, role, category) VALUES (?, ?, ?, ?)',
      ['Parent Meeting Scheduled', `Meeting on ${meeting_date} at ${meeting_time}`, 'student', 'Meeting']
    );
    return res.status(201).json({ message: 'Meeting scheduled' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Get meetings ──────────────────────────────────────────
exports.getMeetings = async (req, res) => {
  const teacherId = req.user.refId;
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, st.name as student_name, st.register_number
       FROM parent_meetings pm
       JOIN students st ON pm.student_id = st.id
       WHERE pm.teacher_id = ?
       ORDER BY pm.meeting_date DESC, pm.meeting_time DESC`,
      [teacherId]
    );
    return res.status(200).json({ meetings: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// ── Send quick alert ──────────────────────────────────────
exports.sendAlert = async (req, res) => {
  const senderId = req.user.refId;
  const { student_id, alert_type } = req.body;
  if (!student_id || !alert_type) return res.status(400).json({ message: 'student_id and alert_type required' });

  const ALERT_MESSAGES = {
    absent: '⚠️ Your child was marked Absent today. Please ensure regular attendance.',
    late:   '⏰ Your child arrived Late today.',
    marks:  '📊 Your child\'s marks have been published. Please check the student portal.',
    fee:    '💳 Fee payment is pending. Please clear dues before the due date.',
    homework: '📚 New homework has been assigned. Please ensure completion.',
  };

  const content = ALERT_MESSAGES[alert_type] || `Alert: ${alert_type}`;
  const typeMap = { absent: 'attendance_alert', late: 'attendance_alert', marks: 'marks_alert', fee: 'fee_reminder', homework: 'homework' };

  try {
    await pool.query(
      'INSERT INTO parent_messages (sender_id, sender_role, student_id, message_type, content) VALUES (?, ?, ?, ?, ?)',
      [senderId, 'teacher', student_id, typeMap[alert_type] || 'text', content]
    );
    await pool.query(
      'INSERT INTO notifications (title, message, role, category) VALUES (?, ?, ?, ?)',
      [ALERT_MESSAGES[alert_type]?.split('.')[0] || 'Alert', content, 'student', alert_type]
    );
    return res.status(201).json({ message: 'Alert sent' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

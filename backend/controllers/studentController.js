const pool = require('../config/db');

const getGrade = (marks) => {
  if (marks >= 95) return 'A+';
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B+';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  return 'F';
};

// GET /api/student/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user.refId;

    // Student basic info
    const [[student]] = await pool.query(
      `SELECT s.name, s.register_number, s.gender, s.dob, c.class_name, sec.section_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id = ?`, [studentId]
    );

    // Attendance stats
    const [attRows] = await pool.query(
      'SELECT status FROM attendance WHERE student_id = ?', [studentId]
    );
    const attStats = { total: attRows.length, present: 0, absent: 0, late: 0, leave: 0 };
    attRows.forEach(r => { if (attStats[r.status.toLowerCase()] !== undefined) attStats[r.status.toLowerCase()]++; });
    const attPct = attStats.total > 0 ? ((attStats.present + attStats.late + attStats.leave) / attStats.total * 100).toFixed(1) : '100.0';

    // Marks summary
    const [markRows] = await pool.query(
      `SELECT m.marks_obtained FROM marks m WHERE m.student_id = ?`, [studentId]
    );
    const totalMarks = markRows.reduce((s, r) => s + r.marks_obtained, 0);
    const maxPossible = markRows.length * 100;
    const marksPct = maxPossible > 0 ? (totalMarks / maxPossible * 100).toFixed(1) : '0';
    const grade = maxPossible > 0 ? getGrade(parseFloat(marksPct)) : 'N/A';

    // Pending complaints
    const [[{ pendingComplaints }]] = await pool.query(
      `SELECT COUNT(*) as pendingComplaints FROM complaints WHERE student_id = ? AND status = 'Pending'`, [studentId]
    );

    // Leave requests
    const [[{ leaveRequests }]] = await pool.query(
      `SELECT COUNT(*) as leaveRequests FROM leave_applications WHERE student_id = ?`, [studentId]
    );

    // Unread notifications
    const [allNotifs] = await pool.query(
      `SELECT id FROM notifications WHERE role = 'all' OR role = 'student'`
    );
    const [readNotifs] = await pool.query(
      `SELECT notif_id FROM notification_reads WHERE student_id = ?`, [studentId]
    );
    const readIds = new Set(readNotifs.map(r => r.notif_id));
    const unreadCount = allNotifs.filter(n => !readIds.has(n.id)).length;

    // Latest announcements
    const [announcements] = await pool.query(
      `SELECT id, title, message, created_at FROM notifications WHERE role='all' OR role='student' ORDER BY created_at DESC LIMIT 3`
    );

    // Recent activities (last 5 from attendance + complaints + leave)
    const [recentAtt] = await pool.query(
      `SELECT date as created_at, CONCAT('Attendance marked: ', status) as description FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 3`, [studentId]
    );
    const [recentComp] = await pool.query(
      `SELECT created_at, CONCAT('Complaint filed: ', title) as description FROM complaints WHERE student_id = ? ORDER BY created_at DESC LIMIT 2`, [studentId]
    );
    const activities = [...recentAtt, ...recentComp]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    return res.status(200).json({
      student,
      summary: {
        attendance_pct: attPct,
        total_marks: totalMarks,
        max_possible: maxPossible,
        marks_pct: marksPct,
        grade,
        pending_complaints: pendingComplaints,
        leave_requests: leaveRequests,
        unread_notifications: unreadCount
      },
      activities,
      announcements
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard' });
  }
};

// GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      `SELECT s.*, c.class_name, sec.section_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id = ?`,
      [studentId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
    return res.status(200).json({ student: rows[0] });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// GET /api/student/attendance
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      'SELECT date, status, remarks FROM attendance WHERE student_id = ? ORDER BY date DESC',
      [studentId]
    );
    const stats = {
      total: rows.length,
      present: rows.filter(r => r.status === 'Present').length,
      absent: rows.filter(r => r.status === 'Absent').length,
      leave: rows.filter(r => r.status === 'Leave').length,
      late: rows.filter(r => r.status === 'Late').length,
    };
    stats.percentage = stats.total > 0
      ? ((stats.present + stats.late + stats.leave) / stats.total * 100).toFixed(1)
      : '100.0';

    // Monthly grouping
    const monthMap = {};
    rows.forEach(r => {
      const month = r.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { month, present: 0, absent: 0, late: 0, leave: 0 };
      const s = r.status.toLowerCase();
      if (monthMap[month][s] !== undefined) monthMap[month][s]++;
    });
    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    return res.status(200).json({ attendance: rows, stats, monthly });
  } catch (error) {
    console.error('getAttendance error:', error);
    return res.status(500).json({ message: 'Server error retrieving attendance' });
  }
};

// GET /api/student/marks
exports.getMarks = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      `SELECT m.id, m.marks_obtained, s.subject_name
       FROM marks m JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ?`, [studentId]
    );
    const marksWithGrades = rows.map(r => ({
      subject: r.subject_name,
      marks: r.marks_obtained,
      max_marks: 100,
      grade: getGrade(r.marks_obtained)
    }));
    const totalMarks = rows.reduce((s, r) => s + r.marks_obtained, 0);
    const totalMax = rows.length * 100;
    const percentage = totalMax > 0 ? (totalMarks / totalMax * 100).toFixed(1) : '0';
    const grade = totalMax > 0 ? getGrade(parseFloat(percentage)) : 'N/A';

    let top_subject = 'N/A', weak_subject = 'N/A';
    if (marksWithGrades.length > 0) {
      const sorted = [...marksWithGrades].sort((a, b) => b.marks - a.marks);
      top_subject = sorted[0].subject;
      weak_subject = sorted[sorted.length - 1].subject;
    }

    return res.status(200).json({
      marks: marksWithGrades,
      summary: { total: totalMarks, maxPossible: totalMax, percentage, grade, top_subject, weak_subject }
    });
  } catch (error) {
    console.error('getMarks error:', error);
    return res.status(500).json({ message: 'Server error retrieving marks' });
  }
};

// GET /api/student/timetable
exports.getTimetable = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [studentRows] = await pool.query('SELECT class_id, section_id FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0 || !studentRows[0].class_id) {
      return res.status(400).json({ message: 'Student is not assigned to a class or section yet.' });
    }
    const { class_id, section_id } = studentRows[0];
    const [rows] = await pool.query(
      `SELECT t.day_of_week, t.period_number, s.subject_name, teach.name as teacher_name
       FROM timetable t
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN teachers teach ON t.teacher_id = teach.id
       WHERE t.class_id = ? AND t.section_id = ?
       ORDER BY FIELD(t.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.period_number`,
      [class_id, section_id]
    );
    return res.status(200).json({ timetable: rows });
  } catch (error) {
    console.error('getTimetable error:', error);
    return res.status(500).json({ message: 'Server error retrieving timetable' });
  }
};

// POST /api/student/leave
exports.submitLeave = async (req, res) => {
  const { type, from_date, to_date, reason } = req.body;
  const studentId = req.user.refId;
  if (!type || !from_date || !to_date || !reason)
    return res.status(400).json({ message: 'All fields are required' });
  if (new Date(from_date) > new Date(to_date))
    return res.status(400).json({ message: 'From date must be before or equal to To date' });
  try {
    const [result] = await pool.query(
      'INSERT INTO leave_applications (student_id, type, from_date, to_date, reason) VALUES (?, ?, ?, ?, ?)',
      [studentId, type, from_date, to_date, reason]
    );
    return res.status(201).json({ message: 'Leave application submitted successfully', id: result.insertId });
  } catch (error) {
    console.error('submitLeave error:', error);
    return res.status(500).json({ message: 'Server error submitting leave' });
  }
};

// GET /api/student/leave
exports.getLeaves = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      'SELECT id, type, from_date, to_date, reason, status, created_at FROM leave_applications WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    return res.status(200).json({ leaves: rows });
  } catch (error) {
    console.error('getLeaves error:', error);
    return res.status(500).json({ message: 'Server error retrieving leaves' });
  }
};

// POST /api/student/complaints
exports.raiseComplaint = async (req, res) => {
  const { title, description, is_anonymous, category, priority } = req.body;
  const studentId = req.user.refId;
  if (!title || !description)
    return res.status(400).json({ message: 'Title and description are required' });
  try {
    await pool.query(
      'INSERT INTO complaints (student_id, title, description, is_anonymous, status, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, title, description, is_anonymous ? 1 : 0, 'Pending', category || 'Other', priority || 'Medium']
    );
    return res.status(201).json({ message: 'Complaint submitted successfully!' });
  } catch (error) {
    console.error('raiseComplaint error:', error);
    return res.status(500).json({ message: 'Server error filing complaint' });
  }
};

// GET /api/student/complaints
exports.getComplaints = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      'SELECT id, title, description, is_anonymous, status, reply, admin_reply, category, priority, created_at FROM complaints WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    return res.status(200).json({ complaints: rows });
  } catch (error) {
    console.error('getComplaints error:', error);
    return res.status(500).json({ message: 'Server error retrieving complaints' });
  }
};

// GET /api/student/notifications
exports.getNotifications = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.role, n.type, n.created_at,
              CASE WHEN nr.is_read = 1 THEN 1 ELSE 0 END as is_read
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notif_id = n.id AND nr.student_id = ?
       WHERE n.role = 'all' OR n.role = 'student'
       ORDER BY n.created_at DESC`,
      [studentId]
    );
    return res.status(200).json({ notifications: rows });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ message: 'Server error retrieving notifications' });
  }
};

// PATCH /api/student/notifications/read/:notifId
exports.markNotificationRead = async (req, res) => {
  try {
    const studentId = req.user.refId;
    const { notifId } = req.params;
    await pool.query(
      'INSERT INTO notification_reads (notif_id, student_id, is_read) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_read = 1',
      [notifId, studentId]
    );
    return res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/student/fees
exports.getFees = async (req, res) => {
  try {
    const studentId = req.user.refId;

    // All fee records
    const [fees] = await pool.query(
      `SELECT id, fee_type, term, total_amount, paid_amount, due_date, status, academic_year,
              (total_amount - paid_amount) as pending_amount
       FROM fees WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    // Summary
    const totalFees    = fees.reduce((s, f) => s + parseFloat(f.total_amount), 0);
    const totalPaid    = fees.reduce((s, f) => s + parseFloat(f.paid_amount), 0);
    const totalPending = totalFees - totalPaid;
    const paidPct      = totalFees > 0 ? ((totalPaid / totalFees) * 100).toFixed(1) : '0';

    // Payment history
    const [payments] = await pool.query(
      `SELECT fp.id, fp.receipt_number, fp.amount, fp.payment_date, fp.payment_mode, fp.remarks,
              f.fee_type, f.term
       FROM fee_payments fp
       JOIN fees f ON fp.fee_id = f.id
       WHERE fp.student_id = ?
       ORDER BY fp.payment_date DESC`,
      [studentId]
    );

    // Transport fees
    const [transport] = await pool.query(
      `SELECT * FROM transport_fees WHERE student_id = ?`,
      [studentId]
    );
    const transportData = transport[0] || null;
    let transportPending = 0;
    if (transportData) {
      transportPending = (transportData.total_months - transportData.months_paid) * parseFloat(transportData.monthly_fee);
    }

    return res.status(200).json({
      fees,
      summary: { totalFees, totalPaid, totalPending, paidPct },
      payments,
      transport: transportData ? { ...transportData, pending_amount: transportPending } : null
    });
  } catch (error) {
    console.error('getFees error:', error);
    return res.status(500).json({ message: 'Server error retrieving fees' });
  }
};

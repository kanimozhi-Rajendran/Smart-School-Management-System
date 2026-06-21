const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

// ---------------- DASHBOARD STATISTICS ----------------
exports.getStats = async (req, res) => {
  try {
    const [[studentsCount]] = await pool.query('SELECT COUNT(*) as count FROM students');
    const [[teachersCount]] = await pool.query('SELECT COUNT(*) as count FROM teachers');
    const [[classesCount]] = await pool.query('SELECT COUNT(*) as count FROM classes');
    const [[complaintsCount]] = await pool.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Pending'");

    // Today's attendance overview
    const today = new Date().toISOString().split('T')[0];
    const [attendanceRows] = await pool.query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status`,
      [today]
    );

    const attendanceStats = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
    attendanceRows.forEach(row => {
      if (attendanceStats[row.status] !== undefined) {
        attendanceStats[row.status] = row.count;
      }
    });

    return res.status(200).json({
      stats: {
        students: studentsCount.count,
        teachers: teachersCount.count,
        classes: classesCount.count,
        pendingComplaints: complaintsCount.count,
        attendanceToday: attendanceStats
      }
    });
  } catch (error) {
    console.error('getStats admin controller error:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard statistics' });
  }
};

// ---------------- STUDENT MANAGEMENT (Admin Role) ----------------
exports.getStudents = async (req, res) => {
  const { search, class_id, section_id } = req.query;
  try {
    let query = `
      SELECT s.*, c.class_name, sec.section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }
    if (search) {
      query += ' AND (s.name LIKE ? OR s.register_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.register_number';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ students: rows });
  } catch (error) {
    console.error('getStudents admin controller error:', error);
    return res.status(500).json({ message: 'Server error retrieving students list' });
  }
};

exports.addStudent = async (req, res) => {
  const {
    register_number,
    name,
    dob,
    gender,
    father_name,
    mother_name,
    parent_mobile,
    address,
    class_id,
    section_id
  } = req.body;

  if (!register_number || !name || !dob || !gender || !father_name || !mother_name || !parent_mobile || !address || !class_id || !section_id) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [exists] = await connection.query('SELECT id FROM users WHERE username = ?', [register_number]);
    if (exists.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'A student with this Register Number already exists' });
    }

    const hashedPassword = await bcrypt.hash(dob, 10);

    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [register_number, hashedPassword, 'student']
    );

    await connection.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.insertId, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id]
    );

    await connection.commit();
    return res.status(201).json({ message: 'Student added successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('addStudent admin controller error:', error);
    return res.status(500).json({ message: 'Server error creating student' });
  } finally {
    connection.release();
  }
};

exports.editStudent = async (req, res) => {
  const { id } = req.params;
  const {
    register_number,
    name,
    dob,
    gender,
    father_name,
    mother_name,
    parent_mobile,
    address,
    class_id,
    section_id
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [studentRows] = await connection.query('SELECT user_id, dob FROM students WHERE id = ?', [id]);
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Student not found' });
    }
    const student = studentRows[0];

    const [usernameClash] = await connection.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [register_number, student.user_id]
    );
    if (usernameClash.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Register Number already taken' });
    }

    if (dob !== student.dob) {
      const hashedPw = await bcrypt.hash(dob, 10);
      await connection.query(
        'UPDATE users SET username = ?, password = ? WHERE id = ?',
        [register_number, hashedPw, student.user_id]
      );
    } else {
      await connection.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [register_number, student.user_id]
      );
    }

    await connection.query(
      `UPDATE students 
       SET register_number = ?, name = ?, dob = ?, gender = ?, father_name = ?, mother_name = ?, parent_mobile = ?, address = ?, class_id = ?, section_id = ?
       WHERE id = ?`,
      [register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id, id]
    );

    await connection.commit();
    return res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('editStudent admin controller error:', error);
    return res.status(500).json({ message: 'Server error updating student details' });
  } finally {
    connection.release();
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const [studentRows] = await pool.query('SELECT user_id FROM students WHERE id = ?', [id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [studentRows[0].user_id]);
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('deleteStudent admin controller error:', error);
    return res.status(500).json({ message: 'Server error deleting student' });
  }
};

// ---------------- TEACHER MANAGEMENT ----------------
exports.getTeachers = async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM teachers';
    const params = [];
    if (search) {
      query += ' WHERE name LIKE ? OR teacher_id LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY teacher_id';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ teachers: rows });
  } catch (error) {
    console.error('getTeachers admin controller error:', error);
    return res.status(500).json({ message: 'Server error retrieving teachers list' });
  }
};

exports.addTeacher = async (req, res) => {
  const { teacher_id, name, email, phone, password } = req.body;

  if (!teacher_id || !name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [exists] = await connection.query('SELECT id FROM users WHERE username = ?', [teacher_id]);
    if (exists.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'A teacher with this ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [teacher_id, hashedPassword, 'teacher']
    );

    await connection.query(
      'INSERT INTO teachers (user_id, teacher_id, name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [userRes.insertId, teacher_id, name, email, phone]
    );

    await connection.commit();
    return res.status(201).json({ message: 'Teacher added successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('addTeacher admin controller error:', error);
    return res.status(500).json({ message: 'Server error creating teacher' });
  } finally {
    connection.release();
  }
};

exports.editTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacher_id, name, email, phone, password } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [teacherRows] = await connection.query('SELECT user_id FROM teachers WHERE id = ?', [id]);
    if (teacherRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Teacher not found' });
    }
    const teacher = teacherRows[0];

    const [usernameClash] = await connection.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [teacher_id, teacher.user_id]
    );
    if (usernameClash.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Teacher ID already taken' });
    }

    if (password && password.trim() !== '') {
      const hashedPw = await bcrypt.hash(password, 10);
      await connection.query(
        'UPDATE users SET username = ?, password = ? WHERE id = ?',
        [teacher_id, hashedPw, teacher.user_id]
      );
    } else {
      await connection.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [teacher_id, teacher.user_id]
      );
    }

    await connection.query(
      'UPDATE teachers SET teacher_id = ?, name = ?, email = ?, phone = ? WHERE id = ?',
      [teacher_id, name, email, phone, id]
    );

    await connection.commit();
    return res.status(200).json({ message: 'Teacher updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('editTeacher admin controller error:', error);
    return res.status(500).json({ message: 'Server error updating teacher details' });
  } finally {
    connection.release();
  }
};

exports.deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    const [teacherRows] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [id]);
    if (teacherRows.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [teacherRows[0].user_id]);
    return res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('deleteTeacher admin controller error:', error);
    return res.status(500).json({ message: 'Server error deleting teacher' });
  }
};

// ---------------- ATTENDANCE MANAGEMENT (Admin Role) ----------------
exports.getAttendanceSheet = async (req, res) => {
  const { class_id, section_id, date } = req.query;

  if (!class_id || !section_id || !date) {
    return res.status(400).json({ message: 'Provide class_id, section_id, and date' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.id as student_id, s.register_number, s.name, a.status, a.edit_count, a.is_locked, a.id as attendance_id
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
       WHERE s.class_id = ? AND s.section_id = ?
       ORDER BY s.register_number`,
      [date, class_id, section_id]
    );
    return res.status(200).json({ attendanceList: rows });
  } catch (error) {
    console.error('getAttendanceSheet error:', error);
    return res.status(500).json({ message: 'Server error fetching attendance details' });
  }
};

// Unlock attendance edit for a student
exports.unlockAttendance = async (req, res) => {
  const { id } = req.params; // attendance.id
  try {
    await pool.query(
      'UPDATE attendance SET is_locked = 0, edit_count = 0 WHERE id = ?',
      [id]
    );
    return res.status(200).json({ message: 'Attendance record unlocked. Teacher can now edit.' });
  } catch (error) {
    console.error('unlockAttendance error:', error);
    return res.status(500).json({ message: 'Server error unlocking attendance record' });
  }
};

// ---------------- MARKS MANAGEMENT (Admin Role) ----------------
exports.getMarksSheet = async (req, res) => {
  const { class_id, section_id, subject_id } = req.query;

  if (!class_id || !section_id || !subject_id) {
    return res.status(400).json({ message: 'Provide class_id, section_id, and subject_id' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.id as student_id, s.register_number, s.name, m.marks_obtained, m.id as mark_id
       FROM students s
       LEFT JOIN marks m ON s.id = m.student_id AND m.subject_id = ?
       WHERE s.class_id = ? AND s.section_id = ?
       ORDER BY s.register_number`,
      [subject_id, class_id, section_id]
    );
    return res.status(200).json({ marksList: rows });
  } catch (error) {
    console.error('getMarksSheet error:', error);
    return res.status(500).json({ message: 'Server error fetching marks details' });
  }
};

exports.saveMarks = async (req, res) => {
  const { class_id, section_id, subject_id, marksList } = req.body;
  if (!class_id || !section_id || !subject_id || !marksList || !Array.isArray(marksList)) {
    return res.status(400).json({ message: 'Invalid payload.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of marksList) {
      const { student_id, marks_obtained } = item;
      const markVal = parseInt(marks_obtained);
      if (isNaN(markVal) || markVal < 0 || markVal > 100) {
        await connection.rollback();
        return res.status(400).json({ message: 'Marks must be an integer between 0 and 100.' });
      }
      await connection.query(
        `INSERT INTO marks (student_id, subject_id, marks_obtained)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained)`,
        [student_id, subject_id, markVal]
      );
    }
    await connection.commit();
    return res.status(200).json({ message: 'Marks updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('saveMarks error:', error);
    return res.status(500).json({ message: 'Server error updating marks' });
  } finally {
    connection.release();
  }
};

// ---------------- TIMETABLE MANAGEMENT ----------------
exports.getFullTimetable = async (req, res) => {
  const { class_id, section_id } = req.query;
  if (!class_id || !section_id) {
    return res.status(400).json({ message: 'Provide class_id and section_id' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT t.*, s.subject_name, teach.name as teacher_name
       FROM timetable t
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN teachers teach ON t.teacher_id = teach.id
       WHERE t.class_id = ? AND t.section_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.period_number`,
      [class_id, section_id]
    );

    return res.status(200).json({ timetable: rows });
  } catch (error) {
    console.error('getFullTimetable error:', error);
    return res.status(500).json({ message: 'Server error fetching timetable' });
  }
};

exports.saveTimetableSlot = async (req, res) => {
  const { class_id, section_id, day_of_week, period_number, subject_id, teacher_id } = req.body;
  if (!class_id || !section_id || !day_of_week || !period_number) {
    return res.status(400).json({ message: 'Please fill in class, section, day and period number' });
  }

  try {
    await pool.query(
      `INSERT INTO timetable (class_id, section_id, day_of_week, period_number, subject_id, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id), teacher_id = VALUES(teacher_id)`,
      [class_id, section_id, day_of_week, period_number, subject_id || null, teacher_id || null]
    );

    return res.status(200).json({ message: 'Timetable period updated successfully' });
  } catch (error) {
    console.error('saveTimetableSlot error:', error);
    return res.status(500).json({ message: 'Server error saving timetable slot' });
  }
};

// ---------------- COMPLAINTS MANAGEMENT ----------------
exports.getComplaints = async (req, res) => {
  try {
    // Implement anonymity check: if is_anonymous = 1, substitute name/reg_no
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.description, c.is_anonymous, c.status, c.reply, c.created_at,
              IF(c.is_anonymous = 1, 'Anonymous', s.name) AS student_name,
              IF(c.is_anonymous = 1, 'N/A', s.register_number) AS register_number
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       ORDER BY c.created_at DESC`
    );

    return res.status(200).json({ complaints: rows });
  } catch (error) {
    console.error('getComplaints error:', error);
    return res.status(500).json({ message: 'Server error retrieving complaints' });
  }
};

exports.replyComplaint = async (req, res) => {
  const { id } = req.params;
  const { reply, status } = req.body; // status is 'In Progress' or 'Resolved'

  if (!reply || !status) {
    return res.status(400).json({ message: 'Please provide reply message and status' });
  }

  try {
    await pool.query(
      'UPDATE complaints SET reply = ?, status = ? WHERE id = ?',
      [reply, status, id]
    );

    return res.status(200).json({ message: 'Complaint updated and reply sent successfully' });
  } catch (error) {
    console.error('replyComplaint error:', error);
    return res.status(500).json({ message: 'Server error updating complaint' });
  }
};

// ---------------- NOTIFICATIONS MANAGEMENT ----------------
exports.addNotification = async (req, res) => {
  const { title, message, role } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }
  try {
    await pool.query(
      'INSERT INTO notifications (title, message, role) VALUES (?, ?, ?)',
      [title, message, role || 'all']
    );
    return res.status(201).json({ message: 'Notification broadcasted successfully' });
  } catch (error) {
    console.error('addNotification error:', error);
    return res.status(500).json({ message: 'Server error creating notification' });
  }
};

// ---------------- METADATA FETCH (Classes/Sections/Subjects) ----------------
exports.getClasses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM classes ORDER BY class_name');
    return res.status(200).json({ classes: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving classes' });
  }
};

exports.getSections = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sections ORDER BY section_name');
    return res.status(200).json({ sections: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving sections' });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY subject_name');
    return res.status(200).json({ subjects: rows });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving subjects' });
  }
};

// ---------------- EXCEL EXPORTS ----------------

exports.exportStudents = async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT s.register_number, s.name, s.dob, s.gender, s.father_name, s.mother_name, s.parent_mobile, s.address, c.class_name, sec.section_name 
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       ORDER BY s.register_number`
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');

    sheet.columns = [
      { header: 'Register Number', key: 'register_number', width: 20 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Father Name', key: 'father_name', width: 20 },
      { header: 'Mother Name', key: 'mother_name', width: 20 },
      { header: 'Parent Mobile', key: 'parent_mobile', width: 18 },
      { header: 'Address', key: 'address', width: 35 },
      { header: 'Class', key: 'class_name', width: 15 },
      { header: 'Section', key: 'section_name', width: 10 },
    ];

    sheet.addRows(students);

    // Apply header style
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Students_List.xlsx');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('exportStudents error:', error);
    return res.status(500).json({ message: 'Error exporting students to Excel' });
  }
};

exports.exportAttendance = async (req, res) => {
  const { date } = req.query; // optional date
  try {
    let query = `
      SELECT a.date, s.register_number, s.name as student_name, c.class_name, sec.section_name, a.status, a.is_locked
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
    `;
    const params = [];
    if (date) {
      query += ' WHERE a.date = ?';
      params.push(date);
    }
    query += ' ORDER BY a.date DESC, s.register_number';

    const [rows] = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Register Number', key: 'register_number', width: 20 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Class', key: 'class_name', width: 15 },
      { header: 'Section', key: 'section_name', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Locked (1=Yes, 0=No)', key: 'is_locked', width: 15 },
    ];

    sheet.addRows(rows);

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E46C0A' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.xlsx');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('exportAttendance error:', error);
    return res.status(500).json({ message: 'Error exporting attendance to Excel' });
  }
};

exports.exportMarks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.register_number, s.name as student_name, c.class_name, sec.section_name, sub.subject_name, m.marks_obtained
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       ORDER BY s.register_number, sub.subject_name`
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Academic Marks');

    sheet.columns = [
      { header: 'Register Number', key: 'register_number', width: 20 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Class', key: 'class_name', width: 15 },
      { header: 'Section', key: 'section_name', width: 10 },
      { header: 'Subject', key: 'subject_name', width: 20 },
      { header: 'Marks Obtained', key: 'marks_obtained', width: 15 },
    ];

    sheet.addRows(rows);

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Academic_Marks.xlsx');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('exportMarks error:', error);
    return res.status(500).json({ message: 'Error exporting marks to Excel' });
  }
};

exports.exportComplaints = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.description, c.is_anonymous, c.status, c.reply, c.created_at,
              IF(c.is_anonymous = 1, 'Anonymous', s.name) AS student_name
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       ORDER BY c.created_at DESC`
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Complaints');

    sheet.columns = [
      { header: 'Complaint ID', key: 'id', width: 15 },
      { header: 'Student Name', key: 'student_name', width: 20 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Anonymous (1=Yes, 0=No)', key: 'is_anonymous', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Reply / Action Taken', key: 'reply', width: 30 },
      { header: 'Submitted At', key: 'created_at', width: 20 },
    ];

    sheet.addRows(rows);

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '95B3D7' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Complaints_Report.xlsx');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('exportComplaints error:', error);
    return res.status(500).json({ message: 'Error exporting complaints to Excel' });
  }
};

// ---------------- EXCEL IMPORT ----------------
exports.importStudents = async (req, res) => {
  const { fileData } = req.body; // Expected Base64 Excel sheet string

  if (!fileData) {
    return res.status(400).json({ message: 'Please upload an Excel file represented as a base64 string' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    const importedStudents = [];
    
    // Read class and section tables to map names to IDs
    const [classes] = await connection.query('SELECT * FROM classes');
    const [sections] = await connection.query('SELECT * FROM sections');

    const classMap = {};
    classes.forEach(c => { classMap[c.class_name.toLowerCase().trim()] = c.id; });

    const sectionMap = {};
    sections.forEach(s => { sectionMap[s.section_name.toLowerCase().trim()] = s.id; });

    let rowNum = 0;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      rowNum = rowNumber;
      if (rowNumber > 1) { // Skip header row
        const regNum = row.getCell(1).value?.toString().trim();
        const name = row.getCell(2).value?.toString().trim();
        let dobVal = row.getCell(3).value; // can be Date object or string
        const gender = row.getCell(4).value?.toString().trim();
        const fatherName = row.getCell(5).value?.toString().trim();
        const motherName = row.getCell(6).value?.toString().trim();
        const parentMobile = row.getCell(7).value?.toString().trim();
        const address = row.getCell(8).value?.toString().trim();
        const className = row.getCell(9).value?.toString().trim();
        const sectionName = row.getCell(10).value?.toString().trim();

        if (regNum && name && dobVal && gender && className && sectionName) {
          // Format DOB to YYYY-MM-DD
          let dob = '';
          if (dobVal instanceof Date) {
            dob = dobVal.toISOString().split('T')[0];
          } else {
            dob = dobVal.toString().trim(); // expected "YYYY-MM-DD"
          }

          const classId = classMap[className.toLowerCase()];
          const sectionId = sectionMap[sectionName.toLowerCase()];

          if (!classId || !sectionId) {
            throw new Error(`Row ${rowNumber}: Invalid class name "${className}" or section name "${sectionName}"`);
          }

          importedStudents.push({
            register_number: regNum,
            name,
            dob,
            gender,
            father_name: fatherName || 'Unknown',
            mother_name: motherName || 'Unknown',
            parent_mobile: parentMobile || '0000000000',
            address: address || 'N/A',
            class_id: classId,
            section_id: sectionId
          });
        }
      }
    });

    if (importedStudents.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No valid student records found in the uploaded Excel sheet' });
    }

    // Insert imported students in DB
    for (const stud of importedStudents) {
      // Check if user already exists
      const [exists] = await connection.query('SELECT id FROM users WHERE username = ?', [stud.register_number]);
      if (exists.length > 0) {
        // Skip or update? Let's skip duplicate usernames to avoid clashes
        continue;
      }

      // Hash DOB as default password
      const hashedPassword = await bcrypt.hash(stud.dob, 10);

      const [userRes] = await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [stud.register_number, hashedPassword, 'student']
      );

      await connection.query(
        `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userRes.insertId,
          stud.register_number,
          stud.name,
          stud.dob,
          stud.gender,
          stud.father_name,
          stud.mother_name,
          stud.parent_mobile,
          stud.address,
          stud.class_id,
          stud.section_id
        ]
      );
    }

    await connection.commit();
    return res.status(200).json({
      message: `Imported ${importedStudents.length} student records successfully!`
    });
  } catch (error) {
    await connection.rollback();
    console.error('importStudents error:', error);
    return res.status(500).json({ message: error.message || 'Error processing Excel import' });
  } finally {
    connection.release();
  }
};

// ---------------- FACULTY MANAGEMENT ----------------
exports.getFaculty = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u.username, s.subject_name,
        (SELECT COUNT(DISTINCT tt.class_id) FROM timetable tt WHERE tt.teacher_id = t.id) as assigned_classes,
        (SELECT COUNT(*) FROM timetable tt WHERE tt.teacher_id = t.id) as weekly_periods
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       ORDER BY t.name`
    );
    return res.status(200).json({ faculty: rows });
  } catch (err) {
    console.error('getFaculty error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, department, designation, qualification, experience_yrs, subject_id } = req.body;
  try {
    await pool.query(
      'UPDATE teachers SET name=?, email=?, phone=?, department=?, designation=?, qualification=?, experience_yrs=?, subject_id=? WHERE id=?',
      [name, email, phone, department, designation, qualification, experience_yrs, subject_id || null, id]
    );
    return res.status(200).json({ message: 'Faculty updated' });
  } catch (err) {
    console.error('updateFaculty error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ---------------- ENHANCED ADMIN STATS ----------------
exports.getEnhancedStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[sc]] = await pool.query('SELECT COUNT(*) as cnt FROM students');
    const [[tc]] = await pool.query('SELECT COUNT(*) as cnt FROM teachers');
    const [[pc]] = await pool.query('SELECT COUNT(*) as cnt FROM parents');
    const [[lc]] = await pool.query("SELECT COUNT(*) as cnt FROM leave_applications WHERE status = 'Pending'");
    const [[cc]] = await pool.query("SELECT COUNT(*) as cnt FROM complaints WHERE status = 'Pending'");
    const [[ac]] = await pool.query("SELECT COUNT(*) as cnt FROM assignments WHERE status = 'Published'");
    const [[adc]] = await pool.query("SELECT COUNT(*) as cnt FROM admission_applications WHERE status = 'Pending'");

    // Fees pending
    const [[fc]] = await pool.query("SELECT COALESCE(SUM(total_amount - paid_amount),0) as pending FROM fees WHERE status != 'Paid'");

    // Today attendance
    const [attRows] = await pool.query('SELECT status, COUNT(*) as cnt FROM attendance WHERE date = ? GROUP BY status', [today]);
    const attMap = {};
    attRows.forEach(r => { attMap[r.status] = r.cnt; });
    const presentToday = attMap.Present || 0;
    const absentToday = attMap.Absent || 0;
    const totalToday = Object.values(attMap).reduce((a, b) => a + b, 0);
    const attPct = totalToday > 0 ? ((presentToday / totalToday) * 100).toFixed(1) : 0;

    // Monthly attendance data (last 6 months)
    const [monthlyAtt] = await pool.query(`
      SELECT DATE_FORMAT(date, '%Y-%m') as month,
        SUM(status='Present') as present,
        SUM(status='Absent') as absent,
        COUNT(*) as total
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    // Fee collection by month
    const [monthlyFees] = await pool.query(`
      SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as collected
      FROM fee_payments
      WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    return res.status(200).json({
      stats: {
        students: sc.cnt, teachers: tc.cnt, parents: pc.cnt,
        pendingLeaves: lc.cnt, pendingComplaints: cc.cnt,
        activeAssignments: ac.cnt, pendingAdmissions: adc.cnt,
        feesPending: fc.pending,
        presentToday, absentToday, totalToday, attPct,
      },
      monthlyAttendance: monthlyAtt,
      monthlyFees
    });
  } catch (err) {
    console.error('getEnhancedStats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

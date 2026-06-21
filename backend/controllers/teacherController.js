const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to calculate grade based on marks
const getGrade = (marks) => {
  if (marks >= 95) return 'A+';
  if (marks >= 90) return 'A';
  if (marks >= 80) return 'B+';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  return 'F';
};

// ---------------- STUDENT MANAGEMENT (Teacher Role) ----------------

// Fetch all students (with optional Search and Class/Section filter)
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
      query += ' AND (s.name LIKE ? OR s.register_number LIKE ? OR s.father_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.register_number';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ students: rows });
  } catch (error) {
    console.error('getStudents teacher controller error:', error);
    return res.status(500).json({ message: 'Server error retrieving students list' });
  }
};

// Get single student details
exports.getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.class_name, sec.section_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ student: rows[0] });
  } catch (error) {
    console.error('getStudentById error:', error);
    return res.status(500).json({ message: 'Server error retrieving student details' });
  }
};

// Add new Student
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

    // Check if register number (username) already exists
    const [exists] = await connection.query('SELECT id FROM users WHERE username = ?', [register_number]);
    if (exists.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'A student with this Register Number already exists' });
    }

    // Hash the Date of Birth to use as initial password
    const hashedPassword = await bcrypt.hash(dob, 10);

    // Create user credentials record
    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [register_number, hashedPassword, 'student']
    );

    // Insert student profile record
    await connection.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.insertId, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id]
    );

    await connection.commit();
    return res.status(201).json({ message: 'Student added successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('addStudent teacher controller error:', error);
    return res.status(500).json({ message: 'Server error creating student' });
  } finally {
    connection.release();
  }
};

// Edit student details
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

    // Retrieve current student data
    const [studentRows] = await connection.query('SELECT user_id, dob FROM students WHERE id = ?', [id]);
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Student not found' });
    }
    const student = studentRows[0];

    // Check if new register number clashes with someone else
    const [usernameClash] = await connection.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [register_number, student.user_id]
    );
    if (usernameClash.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Register Number already taken' });
    }

    // Update user login credentials
    if (dob !== student.dob) {
      // Re-hash password if date of birth changed
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

    // Update profile
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
    console.error('editStudent teacher controller error:', error);
    return res.status(500).json({ message: 'Server error updating student details' });
  } finally {
    connection.release();
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const [studentRows] = await pool.query('SELECT user_id FROM students WHERE id = ?', [id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Deleting the user automatically deletes the student profile due to foreign key cascade
    await pool.query('DELETE FROM users WHERE id = ?', [studentRows[0].user_id]);
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('deleteStudent teacher controller error:', error);
    return res.status(500).json({ message: 'Server error deleting student' });
  }
};

// ---------------- ATTENDANCE MODULE ----------------

// Get attendance sheets for a class and section on a specific date
exports.getAttendanceList = async (req, res) => {
  const { class_id, section_id, date } = req.query;

  if (!class_id || !section_id || !date) {
    return res.status(400).json({ message: 'Please provide class_id, section_id and date' });
  }

  try {
    // Get all students in the class + section
    const [students] = await pool.query(
      `SELECT s.id as student_id, s.register_number, s.name, a.status, a.edit_count, a.is_locked, a.id as attendance_id
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
       WHERE s.class_id = ? AND s.section_id = ?
       ORDER BY s.register_number`,
      [date, class_id, section_id]
    );

    return res.status(200).json({ attendanceList: students });
  } catch (error) {
    console.error('getAttendanceList teacher controller error:', error);
    return res.status(500).json({ message: 'Server error fetching class attendance list' });
  }
};

// Mark / Save attendance for the class (bulk action)
exports.saveAttendance = async (req, res) => {
  const { class_id, section_id, date, attendance } = req.body; // attendance is [{ student_id, status }]

  if (!class_id || !section_id || !date || !attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ message: 'Invalid payload. Provide class_id, section_id, date, and attendance records.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const record of attendance) {
      const { student_id, status } = record;

      // Check if attendance already exists for this student + date
      const [existing] = await connection.query(
        'SELECT id, edit_count, is_locked, status FROM attendance WHERE student_id = ? AND date = ?',
        [student_id, date]
      );

      if (existing.length === 0) {
        // Create initial record
        await connection.query(
          'INSERT INTO attendance (student_id, date, status, edit_count, is_locked) VALUES (?, ?, ?, 0, 0)',
          [student_id, date, status]
        );
      } else {
        const recordDb = existing[0];
        
        // If status is unchanged, do nothing
        if (recordDb.status === status) continue;

        // If it's locked, teacher CANNOT update (only admin can)
        if (recordDb.is_locked === 1) {
          // Skip or rollback and return error
          await connection.rollback();
          return res.status(403).json({
            message: `Attendance is locked for student ID ${student_id} on ${date}. Cannot modify without Admin authorization.`
          });
        }

        // It is not locked. Allow teacher to update exactly ONCE.
        // Update status, increment edit_count, lock it.
        await connection.query(
          'UPDATE attendance SET status = ?, edit_count = edit_count + 1, is_locked = 1 WHERE id = ?',
          [status, recordDb.id]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('saveAttendance teacher controller error:', error);
    return res.status(500).json({ message: 'Server error marking attendance' });
  } finally {
    connection.release();
  }
};

// ---------------- MARKS MODULE ----------------

// Fetch marks of all students in a class & section for a specific subject
exports.getMarksList = async (req, res) => {
  const { class_id, section_id, subject_id } = req.query;

  if (!class_id || !section_id || !subject_id) {
    return res.status(400).json({ message: 'Please provide class_id, section_id and subject_id' });
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
    console.error('getMarksList teacher controller error:', error);
    return res.status(500).json({ message: 'Server error fetching class marks list' });
  }
};

// Save subject marks (bulk upsert)
exports.saveMarks = async (req, res) => {
  const { class_id, section_id, subject_id, marksList } = req.body; // marksList is [{ student_id, marks_obtained }]

  if (!class_id || !section_id || !subject_id || !marksList || !Array.isArray(marksList)) {
    return res.status(400).json({ message: 'Invalid payload. Provide class_id, section_id, subject_id, and marksList.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const item of marksList) {
      const { student_id, marks_obtained } = item;
      
      // Validate marks range
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
    console.error('saveMarks teacher controller error:', error);
    return res.status(500).json({ message: 'Server error updating marks' });
  } finally {
    connection.release();
  }
};

// ---------------- TIMETABLE MODULE ----------------

// Get teacher's personal teaching timetable
exports.getTimetable = async (req, res) => {
  const teacherId = req.user.refId;
  try {
    const [rows] = await pool.query(
      `SELECT t.day_of_week, t.period_number, c.class_name, sec.section_name, s.subject_name
       FROM timetable t
       JOIN classes c ON t.class_id = c.id
       JOIN sections sec ON t.section_id = sec.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.teacher_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.period_number`,
      [teacherId]
    );

    return res.status(200).json({ timetable: rows });
  } catch (error) {
    console.error('getTimetable teacher controller error:', error);
    return res.status(500).json({ message: 'Server error retrieving teacher timetable' });
  }
};

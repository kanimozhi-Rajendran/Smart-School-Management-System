const pool = require('../config/db');

// Teacher: Get assignments they created
exports.getAssignments = async (req, res) => {
  const { class_id, section_id, subject_id } = req.query;
  const teacherId = req.user.refId;
  try {
    let q = `SELECT a.*, sub.subject_name, c.class_name, sec.section_name,
      (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.status IN ('Submitted','Graded')) as submitted_count,
      (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) as total_assigned
      FROM assignments a
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN sections sec ON a.section_id = sec.id
      WHERE a.teacher_id = ?`;
    const params = [teacherId];
    if (class_id) { q += ' AND a.class_id = ?'; params.push(class_id); }
    if (section_id) { q += ' AND a.section_id = ?'; params.push(section_id); }
    if (subject_id) { q += ' AND a.subject_id = ?'; params.push(subject_id); }
    q += ' ORDER BY a.due_date ASC';
    const [rows] = await pool.query(q, params);
    return res.status(200).json({ assignments: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Teacher: Create assignment
exports.createAssignment = async (req, res) => {
  const teacherId = req.user.refId;
  const { title, subject_id, class_id, section_id, description, instructions, due_date, max_marks, priority } = req.body;
  if (!title || !due_date) return res.status(400).json({ message: 'Title and due date are required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO assignments (title, subject_id, class_id, section_id, teacher_id, description, instructions, due_date, max_marks, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, subject_id || null, class_id || null, section_id || null, teacherId, description || '', instructions || '', due_date, max_marks || 100, priority || 'Medium', 'Published']
    );
    // Auto-create submission records for all students in the class
    if (class_id && section_id) {
      const [students] = await pool.query('SELECT id FROM students WHERE class_id = ? AND section_id = ?', [class_id, section_id]);
      for (const s of students) {
        await pool.query('INSERT IGNORE INTO assignment_submissions (assignment_id, student_id, status) VALUES (?, ?, ?)', [result.insertId, s.id, 'Pending']);
      }
      // Send notification to students
      await pool.query('INSERT INTO notifications (title, message, role, category, priority) VALUES (?, ?, ?, ?, ?)',
        [`New Assignment: ${title}`, `A new assignment has been assigned. Due date: ${due_date}`, 'student', 'Assignment', 'Important']);
    }
    return res.status(201).json({ message: 'Assignment created', id: result.insertId });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Teacher: Update assignment
exports.updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, description, instructions, due_date, max_marks, priority, status } = req.body;
  try {
    await pool.query(
      'UPDATE assignments SET title=?, description=?, instructions=?, due_date=?, max_marks=?, priority=?, status=? WHERE id=?',
      [title, description, instructions, due_date, max_marks, priority, status, id]
    );
    return res.status(200).json({ message: 'Assignment updated' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Teacher: Delete assignment
exports.deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM assignments WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Assignment deleted' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Teacher: Get submissions for an assignment
exports.getSubmissions = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.*, st.name as student_name, st.register_number
       FROM assignment_submissions s
       JOIN students st ON s.student_id = st.id
       WHERE s.assignment_id = ?
       ORDER BY st.name`,
      [assignmentId]
    );
    return res.status(200).json({ submissions: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Teacher: Grade a submission
exports.gradeSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { marks_obtained, remarks } = req.body;
  try {
    await pool.query(
      'UPDATE assignment_submissions SET marks_obtained=?, remarks=?, status=? WHERE id=?',
      [marks_obtained, remarks, 'Graded', submissionId]
    );
    return res.status(200).json({ message: 'Submission graded' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Student: Get their assignments
exports.getStudentAssignments = async (req, res) => {
  const studentId = req.user.refId;
  try {
    const [[student]] = await pool.query('SELECT class_id, section_id FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const [rows] = await pool.query(
      `SELECT a.*, sub.subject_name, c.class_name,
        COALESCE(s.status, 'Pending') as submission_status,
        s.marks_obtained, s.remarks, s.submitted_at, s.id as submission_id
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
       WHERE (a.class_id = ? OR a.class_id IS NULL)
         AND (a.section_id = ? OR a.section_id IS NULL)
         AND a.status = 'Published'
       ORDER BY a.due_date ASC`,
      [studentId, student.class_id, student.section_id]
    );
    return res.status(200).json({ assignments: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Admin: Get all assignments
exports.getAllAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, sub.subject_name, c.class_name, sec.section_name, t.name as teacher_name,
        (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id AND s.status IN ('Submitted','Graded')) as submitted_count
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN sections sec ON a.section_id = sec.id
       LEFT JOIN teachers t ON a.teacher_id = t.id
       ORDER BY a.created_at DESC`
    );
    return res.status(200).json({ assignments: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

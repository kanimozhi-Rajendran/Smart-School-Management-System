const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Generate unique admission number
async function generateAdmissionNumber() {
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM admission_applications');
  return `ADM${new Date().getFullYear()}${String(cnt + 1).padStart(4, '0')}`;
}

// Generate register number
async function generateRegisterNumber() {
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM students');
  return `S${String(cnt + 1).padStart(3, '0')}`;
}

// Create new admission application
exports.createAdmission = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const admission_number = await generateAdmissionNumber();
    const register_number = await generateRegisterNumber();

    const {
      student_name, gender, dob, blood_group, religion, community, nationality, mother_tongue, aadhaar_number,
      class_id, section_id, academic_year, medium,
      father_name, father_occupation, father_mobile, father_email, father_annual_income,
      mother_name, mother_occupation, mother_mobile, mother_email,
      permanent_address, city, district, state, pin_code,
      emergency_contact_name, emergency_contact_phone,
      previous_school, tc_number, tc_date
    } = req.body;

    if (!student_name || !gender || !dob) {
      await conn.rollback();
      return res.status(400).json({ message: 'Student name, gender and DOB are required' });
    }

    // Insert into admission_applications
    const [appResult] = await conn.query(
      `INSERT INTO admission_applications
        (admission_number, register_number, student_name, gender, dob, blood_group, religion, community,
         nationality, mother_tongue, aadhaar_number, class_id, section_id, academic_year, medium,
         father_name, father_occupation, father_mobile, father_email,
         mother_name, mother_occupation, mother_mobile, mother_email,
         permanent_address, city, district, state, pin_code,
         emergency_contact_name, emergency_contact_phone,
         previous_school, tc_number, status, admission_date, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [admission_number, register_number, student_name, gender, dob, blood_group, religion, community,
       nationality || 'Indian', mother_tongue, aadhaar_number,
       class_id || null, section_id || null, academic_year || '2024-25', medium || 'Tamil Medium',
       father_name, father_occupation, father_mobile, father_email,
       mother_name, mother_occupation, mother_mobile, mother_email,
       permanent_address, city, district, state || 'Tamil Nadu', pin_code,
       emergency_contact_name, emergency_contact_phone,
       previous_school, tc_number,
       'Pending', new Date().toISOString().split('T')[0], req.user?.refId || null]
    );

    await conn.commit();
    return res.status(201).json({
      message: 'Admission application submitted successfully',
      id: appResult.insertId,
      admission_number,
      register_number
    });
  } catch (err) {
    await conn.rollback();
    console.error('createAdmission error:', err);
    return res.status(500).json({ message: 'Server error creating admission' });
  } finally { conn.release(); }
};

// Get all admissions
exports.getAdmissions = async (req, res) => {
  const { status, class_id, search } = req.query;
  try {
    let q = `SELECT a.*, c.class_name, sec.section_name
             FROM admission_applications a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN sections sec ON a.section_id = sec.id
             WHERE 1=1`;
    const params = [];
    if (status) { q += ' AND a.status = ?'; params.push(status); }
    if (class_id) { q += ' AND a.class_id = ?'; params.push(class_id); }
    if (search) { q += ' AND (a.student_name LIKE ? OR a.admission_number LIKE ? OR a.register_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY a.created_at DESC';
    const [rows] = await pool.query(q, params);
    return res.status(200).json({ admissions: rows });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

// Approve admission and create student account
exports.approveAdmission = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[app]] = await conn.query('SELECT * FROM admission_applications WHERE id = ?', [id]);
    if (!app) { await conn.rollback(); return res.status(404).json({ message: 'Application not found' }); }
    if (app.status === 'Approved') { await conn.rollback(); return res.status(400).json({ message: 'Already approved' }); }

    // Create user account (password = DOB)
    const hashedPw = await bcrypt.hash(app.dob, 10);
    const [ur] = await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [app.register_number, hashedPw, 'student']);

    // Create student record
    await conn.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address,
        class_id, section_id, blood_group, religion, community, admission_number, admission_date, academic_year, parent_email, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ur.insertId, app.register_number, app.student_name, app.dob, app.gender,
       app.father_name || 'N/A', app.mother_name || 'N/A', app.father_mobile || '0000000000',
       app.permanent_address || 'N/A', app.class_id, app.section_id,
       app.blood_group, app.religion, app.community,
       app.admission_number, app.admission_date, app.academic_year,
       app.father_email, app.emergency_contact_phone]
    );

    // Update application status
    await conn.query('UPDATE admission_applications SET status = ? WHERE id = ?', ['Approved', id]);

    await conn.commit();
    return res.status(200).json({ message: 'Admission approved. Student account created.', register_number: app.register_number });
  } catch (err) {
    await conn.rollback();
    console.error('approveAdmission error:', err);
    return res.status(500).json({ message: 'Server error approving admission' });
  } finally { conn.release(); }
};

// Reject admission
exports.rejectAdmission = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE admission_applications SET status = ? WHERE id = ?', ['Rejected', id]);
    return res.status(200).json({ message: 'Application rejected' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

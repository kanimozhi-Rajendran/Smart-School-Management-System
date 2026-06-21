const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforcollegesystem', {
    expiresIn: '30d',
  });
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username/register number and password/DOB' });
  }

  try {
    console.log('LOGIN ATTEMPT >> username:', JSON.stringify(username), '| password length:', password.length);
    // Look up user by username (register number/teacher ID/admin username)
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password/DOB.' });
    }

    // Get specific profile details
    let profile = { id: user.id, username: user.username, role: user.role };
    let refId = null;

    if (user.role === 'student') {
      const [students] = await pool.query(
        `SELECT s.id, s.name, s.dob, s.gender, c.class_name, sec.section_name 
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN sections sec ON s.section_id = sec.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (students.length > 0) {
        profile = { ...profile, ...students[0] };
        refId = students[0].id;
      }
    } else if (user.role === 'teacher') {
      const [teachers] = await pool.query('SELECT id, name, email, phone, teacher_id FROM teachers WHERE user_id = ?', [user.id]);
      if (teachers.length > 0) {
        profile = { ...profile, ...teachers[0] };
        refId = teachers[0].id;
      }
    } else if (user.role === 'admin') {
      const [admins] = await pool.query('SELECT id, name, email FROM admins WHERE user_id = ?', [user.id]);
      if (admins.length > 0) {
        profile = { ...profile, ...admins[0] };
        refId = admins[0].id;
      }
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        refId,
        username: user.username,
        role: user.role,
        name: profile.name || user.username,
        class_name: profile.class_name || null,
        section_name: profile.section_name || null
      }
    });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ message: 'Server error during login authentication' });
  }
};

// Get profile of currently logged-in user
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('getMe controller error:', error);
    return res.status(500).json({ message: 'Server error fetching user details' });
  }
};

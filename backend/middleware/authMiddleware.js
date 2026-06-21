const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Protect routes - Verify JWT Token
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcollegesystem');
    
    // Fetch user details from database to ensure user still exists
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    const user = rows[0];
    
    // Fetch role-specific reference ID (like student id or teacher id)
    let refId = null;
    let name = '';
    
    if (user.role === 'student') {
      const [student] = await pool.query('SELECT id, name FROM students WHERE user_id = ?', [user.id]);
      if (student.length > 0) {
        refId = student[0].id;
        name = student[0].name;
      }
    } else if (user.role === 'teacher') {
      const [teacher] = await pool.query('SELECT id, name FROM teachers WHERE user_id = ?', [user.id]);
      if (teacher.length > 0) {
        refId = teacher[0].id;
        name = teacher[0].name;
      }
    } else if (user.role === 'admin') {
      const [admin] = await pool.query('SELECT id, name FROM admins WHERE user_id = ?', [user.id]);
      if (admin.length > 0) {
        refId = admin[0].id;
        name = admin[0].name;
      }
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      refId: refId,
      name: name
    };
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Restrict routes to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

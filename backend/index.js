const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const { protect } = require('./middleware/authMiddleware');

// Routes
const authRoutes       = require('./routes/authRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const teacherRoutes    = require('./routes/teacherRoutes');
const studentRoutes    = require('./routes/studentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const admissionRoutes  = require('./routes/admissionRoutes');
const parentRoutes     = require('./routes/parentRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test DB connection
pool.getConnection()
  .then(conn => { console.log('MySQL Database connection verified successfully.'); conn.release(); })
  .catch(err => { console.error('CRITICAL ERROR: Unable to connect to MySQL database:', err.message); });

// ── Shared routes (all authenticated roles) ──────────────
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE role = 'all' OR role = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.role]
    );
    return res.status(200).json({ notifications: rows });
  } catch (err) { return res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/classes', protect, async (req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM classes ORDER BY class_name'); return res.status(200).json({ classes: rows }); }
  catch { return res.status(500).json({ message: 'Error retrieving classes' }); }
});

app.get('/api/sections', protect, async (req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM sections ORDER BY section_name'); return res.status(200).json({ sections: rows }); }
  catch { return res.status(500).json({ message: 'Error retrieving sections' }); }
});

app.get('/api/subjects', protect, async (req, res) => {
  try { const [rows] = await pool.query('SELECT * FROM subjects ORDER BY subject_name'); return res.status(200).json({ subjects: rows }); }
  catch { return res.status(500).json({ message: 'Error retrieving subjects' }); }
});

// ── Mount all modules ────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/teacher',     teacherRoutes);
app.use('/api/student',     studentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admissions',  admissionRoutes);
app.use('/api/parents',     parentRoutes);

// Root
app.get('/', (req, res) => res.send('Smart School Management System API is running.'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

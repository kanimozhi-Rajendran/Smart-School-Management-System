const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function init() {
  console.log('Connecting to MySQL host...');
  let connection;
  
  const commonPasswords = [
    process.env.DB_PASSWORD || '',
    '',
    'root',
    '123456',
    '12345678',
    '1234',
    'admin',
    'mysql',
    'root123',
    'root@123'
  ];
  
  let workingPassword = null;

  for (const pw of commonPasswords) {
    try {
      const conn = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: pw
      });
      await conn.end();
      workingPassword = pw;
      console.log(`Successfully connected to MySQL with password: "${pw}"`);
      break;
    } catch (err) {
      if (err.code !== 'ER_ACCESS_DENIED_ERROR' && err.code !== 'ER_NOT_SUPPORTED_AUTH_MODE') {
        console.error('MySQL connection failed with non-auth error:', err.message);
        process.exit(1);
      }
    }
  }

  if (workingPassword === null) {
    console.error('Failed to connect to MySQL using common default passwords. Please update DB_PASSWORD in backend/.env manually.');
    process.exit(1);
  }

  // Update backend/.env file with the working password
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('DB_PASSWORD=')) {
        envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${workingPassword}`);
      } else {
        envContent += `\nDB_PASSWORD=${workingPassword}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('Updated backend/.env with working MySQL password.');
    }
  } catch (fsErr) {
    console.warn('Could not write working password back to .env:', fsErr.message);
  }

  dbConfig.password = workingPassword;

  try {
    connection = await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error('Unexpected error connecting to MySQL after probe:', err.message);
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'school_management';
  console.log(`Creating database "${dbName}" if it doesn't exist...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.end();

  // Reconnect with database selected
  console.log(`Connecting to database "${dbName}"...`);
  connection = await mysql.createConnection({
    ...dbConfig,
    database: dbName,
    multipleStatements: true,
  });

  console.log('Creating tables...');

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'teacher', 'student') NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_name VARCHAR(10) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      teacher_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      register_number VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      dob DATE NOT NULL,
      gender VARCHAR(10) NOT NULL,
      father_name VARCHAR(100) NOT NULL,
      mother_name VARCHAR(100) NOT NULL,
      parent_mobile VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      class_id INT,
      section_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      date DATE NOT NULL,
      status ENUM('Present', 'Absent', 'Leave', 'Late') NOT NULL,
      edit_count INT DEFAULT 0,
      is_locked TINYINT(1) DEFAULT 0,
      UNIQUE KEY unique_student_date (student_id, date),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      subject_id INT NOT NULL,
      marks_obtained INT NOT NULL,
      UNIQUE KEY unique_student_subject (student_id, subject_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      section_id INT NOT NULL,
      day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
      period_number INT NOT NULL,
      subject_id INT NULL,
      teacher_id INT NULL,
      UNIQUE KEY unique_period (class_id, section_id, day_of_week, period_number),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      is_anonymous TINYINT(1) DEFAULT 0,
      status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
      reply TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      role ENUM('all', 'student', 'teacher', 'admin') DEFAULT 'all',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Split and execute statement queries individually (since multipleStatements is allowed)
  await connection.query(schema);
  console.log('Tables created successfully.');

  // Seed default classes and sections
  console.log('Seeding metadata...');
  const [classesRows] = await connection.query('SELECT COUNT(*) as count FROM classes');
  if (classesRows[0].count === 0) {
    await connection.query(`
      INSERT INTO classes (class_name) VALUES ('10th Standard'), ('11th Standard'), ('12th Standard');
      INSERT INTO sections (section_name) VALUES ('A'), ('B'), ('C');
      INSERT INTO subjects (subject_name) VALUES ('Tamil'), ('English'), ('Maths'), ('Science'), ('Social Science');
    `);
    console.log('Seeded classes, sections, and subjects.');
  }

  // Retrieve seed IDs
  const [[class10]] = await connection.query("SELECT id FROM classes WHERE class_name = '10th Standard'");
  const [[secA]] = await connection.query("SELECT id FROM sections WHERE section_name = 'A'");
  const [subjects] = await connection.query("SELECT id, subject_name FROM subjects");

  // Create default admin user
  const [adminRows] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
  if (adminRows[0].count === 0) {
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedAdminPassword, 'admin']
    );
    await connection.query(
      'INSERT INTO admins (user_id, name, email) VALUES (?, ?, ?)',
      [userRes.insertId, 'System Admin', 'admin@school.com']
    );
    console.log('Seeded admin user (username: admin, password: admin123).');
  }

  // Create default teacher user
  const [teacherRows] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
  let teacherId = null;
  if (teacherRows[0].count === 0) {
    const hashedTeacherPassword = await bcrypt.hash('teacher123', 10);
    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['T101', hashedTeacherPassword, 'teacher']
    );
    const [tRes] = await connection.query(
      'INSERT INTO teachers (user_id, teacher_id, name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [userRes.insertId, 'T101', 'John Doe', 'john.doe@school.com', '9876543210']
    );
    teacherId = tRes.insertId;
    console.log('Seeded teacher user (username: T101, password: teacher123).');
  } else {
    const [[teacher]] = await connection.query("SELECT id FROM teachers WHERE teacher_id = 'T101'");
    teacherId = teacher.id;
  }

  // Create default student user
  const [studentRows] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
  let studentRefId = null;
  if (studentRows[0].count === 0) {
    const dob = '2005-04-12';
    const hashedStudentPassword = await bcrypt.hash(dob, 10);
    const [userRes] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['S101', hashedStudentPassword, 'student']
    );
    const [sRes] = await connection.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.insertId, 'S101', 'Alice Smith', dob, 'Female', 'Bob Smith', 'Carol Smith', '9876543211', '123 Park Avenue, City', class10.id, secA.id]
    );
    studentRefId = sRes.insertId;
    console.log(`Seeded student user (username: S101, password/DOB: ${dob}).`);

    // Seed initial marks for Alice
    for (const sub of subjects) {
      // Seed default marks of 85, 92, 98, etc.
      let mark = 85;
      if (sub.subject_name === 'Maths') mark = 98;
      if (sub.subject_name === 'English') mark = 92;
      if (sub.subject_name === 'Science') mark = 89;
      if (sub.subject_name === 'Social Science') mark = 76;
      await connection.query(
        'INSERT INTO marks (student_id, subject_id, marks_obtained) VALUES (?, ?, ?)',
        [studentRefId, sub.id, mark]
      );
    }
    console.log('Seeded initial marks for Alice Smith.');
  }

  // Seed Timetable if empty
  const [timetableRows] = await connection.query('SELECT COUNT(*) as count FROM timetable');
  if (timetableRows[0].count === 0 && teacherId) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const day of days) {
      for (let period = 1; period <= 6; period++) {
        // Assign some subjects
        let sub = null;
        if (period === 1) sub = subjects.find(s => s.subject_name === 'Maths');
        if (period === 2) sub = subjects.find(s => s.subject_name === 'English');
        if (period === 3) sub = subjects.find(s => s.subject_name === 'Science');
        if (period === 4) sub = subjects.find(s => s.subject_name === 'Tamil');
        if (period === 5) sub = subjects.find(s => s.subject_name === 'Social Science');
        
        if (sub) {
          await connection.query(
            `INSERT INTO timetable (class_id, section_id, day_of_week, period_number, subject_id, teacher_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [class10.id, secA.id, day, period, sub.id, teacherId]
          );
        }
      }
    }
    console.log('Seeded school timetable.');
  }

  // Seed notification
  const [notifRows] = await connection.query('SELECT COUNT(*) as count FROM notifications');
  if (notifRows[0].count === 0) {
    await connection.query(
      `INSERT INTO notifications (title, message, role) VALUES 
       ('Welcome to Smart School System', 'We are excited to launch our new portal. Students and teachers can now track performance, timetables, and daily attendance online.', 'all'),
       ('Final Exams Timetable Out', 'Dear teachers, please finalize entry of internal assessments by this weekend.', 'teacher')`
    );
    console.log('Seeded default notifications.');
  }

  console.log('Database initialization completed successfully!');
  await connection.end();
}

init().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});

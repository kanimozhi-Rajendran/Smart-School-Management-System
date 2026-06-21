require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    multipleStatements: true
  });

  console.log('🚀 Phase 3 Migration Starting...\n');

  // ── 1. Assignments ──────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      subject_id INT,
      class_id INT,
      section_id INT,
      teacher_id INT,
      description TEXT,
      instructions TEXT,
      due_date DATE NOT NULL,
      max_marks INT DEFAULT 100,
      priority ENUM('Low','Medium','High') DEFAULT 'Medium',
      status ENUM('Draft','Published','Closed') DEFAULT 'Published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      student_id INT NOT NULL,
      status ENUM('Pending','Submitted','Graded','Late') DEFAULT 'Pending',
      marks_obtained INT NULL,
      remarks TEXT NULL,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_sub (assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ assignments + assignment_submissions tables');

  // ── 2. Admissions ───────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admission_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admission_number VARCHAR(50) UNIQUE,
      register_number VARCHAR(50) UNIQUE,
      student_name VARCHAR(100) NOT NULL,
      gender ENUM('Male','Female','Other') NOT NULL,
      dob DATE NOT NULL,
      blood_group VARCHAR(5),
      religion VARCHAR(50),
      community VARCHAR(50),
      nationality VARCHAR(50) DEFAULT 'Indian',
      mother_tongue VARCHAR(50),
      aadhaar_number VARCHAR(20),
      class_id INT,
      section_id INT,
      academic_year VARCHAR(10) DEFAULT '2024-25',
      medium VARCHAR(30) DEFAULT 'Tamil Medium',
      father_name VARCHAR(100),
      father_occupation VARCHAR(100),
      father_mobile VARCHAR(20),
      father_email VARCHAR(100),
      mother_name VARCHAR(100),
      mother_occupation VARCHAR(100),
      mother_mobile VARCHAR(20),
      mother_email VARCHAR(100),
      permanent_address TEXT,
      city VARCHAR(50),
      district VARCHAR(50),
      state VARCHAR(50) DEFAULT 'Tamil Nadu',
      pin_code VARCHAR(10),
      emergency_contact_name VARCHAR(100),
      emergency_contact_phone VARCHAR(20),
      previous_school VARCHAR(200),
      tc_number VARCHAR(50),
      status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
      admission_date DATE DEFAULT (CURRENT_DATE),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
    );
  `);
  console.log('✓ admission_applications table');

  // ── 3. Parents ─────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      father_name VARCHAR(100),
      father_phone VARCHAR(20),
      father_email VARCHAR(100),
      father_occupation VARCHAR(100),
      mother_name VARCHAR(100),
      mother_phone VARCHAR(20),
      mother_email VARCHAR(100),
      mother_occupation VARCHAR(100),
      annual_income DECIMAL(12,2),
      guardian_name VARCHAR(100),
      guardian_relation VARCHAR(50),
      guardian_phone VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student_parent (student_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS parent_meetings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      teacher_id INT,
      meeting_date DATE NOT NULL,
      meeting_time TIME NOT NULL,
      purpose TEXT,
      mode ENUM('Online','Offline') DEFAULT 'Offline',
      status ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );
  `);
  console.log('✓ parents + parent_meetings tables');

  // ── 4. Faculty enhancements ────────────────────────────
  const [teacherCols] = await conn.query('SHOW COLUMNS FROM teachers');
  const tcNames = teacherCols.map(c => c.Field);
  const teacherAlters = [];
  if (!tcNames.includes('department'))      teacherAlters.push("ADD COLUMN department VARCHAR(50) DEFAULT 'General'");
  if (!tcNames.includes('designation'))     teacherAlters.push("ADD COLUMN designation VARCHAR(50) DEFAULT 'Teacher'");
  if (!tcNames.includes('qualification'))   teacherAlters.push("ADD COLUMN qualification VARCHAR(100)");
  if (!tcNames.includes('experience_yrs'))  teacherAlters.push("ADD COLUMN experience_yrs INT DEFAULT 0");
  if (!tcNames.includes('subject_id'))      teacherAlters.push("ADD COLUMN subject_id INT NULL");
  if (teacherAlters.length > 0) {
    await conn.query(`ALTER TABLE teachers ${teacherAlters.join(', ')}`);
    console.log('✓ Enhanced teachers table with faculty fields');
  } else { console.log('✓ Teachers table already has faculty fields'); }

  // ── 5. Enhance notifications for announcements ─────────
  const [notifCols] = await conn.query('SHOW COLUMNS FROM notifications');
  const ncNames = notifCols.map(c => c.Field);
  const notifAlters = [];
  if (!ncNames.includes('category'))       notifAlters.push("ADD COLUMN category VARCHAR(50) DEFAULT 'General'");
  if (!ncNames.includes('is_pinned'))      notifAlters.push("ADD COLUMN is_pinned TINYINT(1) DEFAULT 0");
  if (!ncNames.includes('scheduled_date')) notifAlters.push("ADD COLUMN scheduled_date DATE NULL");
  if (!ncNames.includes('priority'))       notifAlters.push("ADD COLUMN priority ENUM('Normal','Important','Urgent') DEFAULT 'Normal'");
  if (notifAlters.length > 0) {
    await conn.query(`ALTER TABLE notifications ${notifAlters.join(', ')}`);
    console.log('✓ Enhanced notifications table');
  } else { console.log('✓ Notifications table already enhanced'); }

  // ── 6. Enhance students table with more fields ─────────
  const [studCols] = await conn.query('SHOW COLUMNS FROM students');
  const scNames = studCols.map(c => c.Field);
  const studAlters = [];
  if (!scNames.includes('blood_group'))     studAlters.push("ADD COLUMN blood_group VARCHAR(5)");
  if (!scNames.includes('religion'))        studAlters.push("ADD COLUMN religion VARCHAR(50)");
  if (!scNames.includes('community'))       studAlters.push("ADD COLUMN community VARCHAR(50)");
  if (!scNames.includes('admission_number'))studAlters.push("ADD COLUMN admission_number VARCHAR(50)");
  if (!scNames.includes('roll_number'))     studAlters.push("ADD COLUMN roll_number VARCHAR(10)");
  if (!scNames.includes('admission_date'))  studAlters.push("ADD COLUMN admission_date DATE");
  if (!scNames.includes('academic_year'))   studAlters.push("ADD COLUMN academic_year VARCHAR(10) DEFAULT '2024-25'");
  if (!scNames.includes('parent_email'))    studAlters.push("ADD COLUMN parent_email VARCHAR(100)");
  if (!scNames.includes('emergency_contact')) studAlters.push("ADD COLUMN emergency_contact VARCHAR(20)");
  if (!scNames.includes('transport_required')) studAlters.push("ADD COLUMN transport_required TINYINT(1) DEFAULT 0");
  if (studAlters.length > 0) {
    await conn.query(`ALTER TABLE students ${studAlters.join(', ')}`);
    console.log('✓ Enhanced students table with additional fields');
  } else { console.log('✓ Students table already enhanced'); }

  await conn.end();
  console.log('\n✅ Phase 3 schema migration complete!\n');
}

migrate().catch(err => { console.error('Migration error:', err.message); process.exit(1); });

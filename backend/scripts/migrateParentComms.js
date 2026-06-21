require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    multipleStatements: true
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS parent_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      sender_role ENUM('teacher','admin') NOT NULL,
      student_id INT NOT NULL,
      message_type ENUM('text','image','pdf','assignment','circular','fee_reminder','meeting_reminder','homework','attendance_alert','marks_alert','exam_notice') DEFAULT 'text',
      content TEXT NOT NULL,
      attachment_url VARCHAR(500),
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS parent_broadcasts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      sender_role ENUM('teacher','admin') NOT NULL,
      class_id INT,
      section_id INT,
      title VARCHAR(200),
      content TEXT NOT NULL,
      message_type VARCHAR(50) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
    );
  `);

  console.log('parent_messages and parent_broadcasts tables created.');
  await conn.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    multipleStatements: true
  });

  console.log('Running Student Portal migrations...');

  // 1. leave_applications table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS leave_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      type ENUM('Sick Leave','Medical Leave','Casual Leave','Emergency Leave','Family Function','Sports','Other') NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ leave_applications table ready');

  // 2. Add category/priority columns to complaints if not exist
  const [cols] = await conn.query(`SHOW COLUMNS FROM complaints`);
  const colNames = cols.map(c => c.Field);

  if (!colNames.includes('category')) {
    await conn.query(`ALTER TABLE complaints ADD COLUMN category VARCHAR(50) DEFAULT 'Other'`);
    console.log('✓ Added category to complaints');
  }
  if (!colNames.includes('priority')) {
    await conn.query(`ALTER TABLE complaints ADD COLUMN priority ENUM('Low','Medium','High') DEFAULT 'Medium'`);
    console.log('✓ Added priority to complaints');
  }
  if (!colNames.includes('admin_reply')) {
    await conn.query(`ALTER TABLE complaints ADD COLUMN admin_reply TEXT NULL`);
    console.log('✓ Added admin_reply to complaints');
  }

  // 3. Add remarks to attendance if not exist
  const [attCols] = await conn.query(`SHOW COLUMNS FROM attendance`);
  const attColNames = attCols.map(c => c.Field);
  if (!attColNames.includes('remarks')) {
    await conn.query(`ALTER TABLE attendance ADD COLUMN remarks VARCHAR(255) NULL`);
    console.log('✓ Added remarks to attendance');
  }

  // 4. Add type to notifications if not exist
  const [notifCols] = await conn.query(`SHOW COLUMNS FROM notifications`);
  const notifColNames = notifCols.map(c => c.Field);
  if (!notifColNames.includes('type')) {
    await conn.query(`ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'announcement'`);
    console.log('✓ Added type to notifications');
  }

  // 5. notification_reads table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notif_id INT NOT NULL,
      student_id INT NOT NULL,
      is_read TINYINT(1) DEFAULT 1,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_read (notif_id, student_id),
      FOREIGN KEY (notif_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ notification_reads table ready');

  await conn.end();
  console.log('All migrations completed successfully!');
}

migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});

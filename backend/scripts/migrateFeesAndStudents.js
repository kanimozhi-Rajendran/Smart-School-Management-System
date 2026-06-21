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

  console.log('Running Fees & Students migration...');

  // 1. fees table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS fees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      fee_type ENUM('Tuition','Transport','Exam','Library','Lab','Sports','Other') NOT NULL DEFAULT 'Tuition',
      term VARCHAR(30) NOT NULL DEFAULT 'Annual',
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      due_date DATE NULL,
      status ENUM('Paid','Partial','Pending','Overdue') DEFAULT 'Pending',
      academic_year VARCHAR(10) DEFAULT '2024-25',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ fees table ready');

  // 2. fee_payments table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fee_id INT NOT NULL,
      student_id INT NOT NULL,
      receipt_number VARCHAR(50) UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode ENUM('Cash','Online','Cheque','DD','Card') DEFAULT 'Cash',
      remarks VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ fee_payments table ready');

  // 3. transport_fees table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS transport_fees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      route_name VARCHAR(100),
      pickup_point VARCHAR(100),
      vehicle_number VARCHAR(20),
      monthly_fee DECIMAL(10,2) DEFAULT 0,
      months_paid INT DEFAULT 0,
      total_months INT DEFAULT 12,
      status ENUM('Active','Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ transport_fees table ready');

  // 4. Seed more students (S102, S103, S104)
  const [[class10]] = await conn.query("SELECT id FROM classes WHERE class_name = '10th Standard'");
  const [[secA]] = await conn.query("SELECT id FROM sections WHERE section_name = 'A'");
  const [[secB]] = await conn.query("SELECT id FROM sections WHERE section_name = 'B'");
  const [subjects] = await conn.query("SELECT id, subject_name FROM subjects");

  const newStudents = [
    { reg: 'S102', name: 'Ravi Kumar', dob: '2006-03-18', gender: 'Male', father: 'Kumar Senior', mother: 'Meena Kumar', mobile: '9876543212', addr: '45 Gandhi Nagar', classId: class10.id, secId: secA.id, marks: [88, 76, 91, 84, 70] },
    { reg: 'S103', name: 'Priya Sharma', dob: '2005-11-25', gender: 'Female', father: 'Rajesh Sharma', mother: 'Sunita Sharma', mobile: '9876543213', addr: '78 Anna Salai', classId: class10.id, secId: secB.id, marks: [95, 98, 100, 97, 92] },
    { reg: 'S104', name: 'Mohammed Ali', dob: '2006-01-14', gender: 'Male', father: 'Ali Hassan', mother: 'Fatima Ali', mobile: '9876543214', addr: '12 MG Road', classId: class10.id, secId: secB.id, marks: [60, 55, 72, 65, 58] },
  ];

  for (const s of newStudents) {
    const [exists] = await conn.query('SELECT id FROM users WHERE username = ?', [s.reg]);
    if (exists.length > 0) { console.log(`  Skipping ${s.reg} - already exists`); continue; }

    const hashed = await bcrypt.hash(s.dob, 10);
    const [userRes] = await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [s.reg, hashed, 'student']);
    const [sRes] = await conn.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address, class_id, section_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.insertId, s.reg, s.name, s.dob, s.gender, s.father, s.mother, s.mobile, s.addr, s.classId, s.secId]
    );
    const studentId = sRes.insertId;

    // Seed marks
    for (let i = 0; i < subjects.length && i < s.marks.length; i++) {
      await conn.query('INSERT IGNORE INTO marks (student_id, subject_id, marks_obtained) VALUES (?, ?, ?)', [studentId, subjects[i].id, s.marks[i]]);
    }

    // Seed fees for each new student
    await conn.query(`
      INSERT INTO fees (student_id, fee_type, term, total_amount, paid_amount, due_date, status, academic_year)
      VALUES
        (?, 'Tuition', 'Term 1', 15000, 15000, '2024-07-31', 'Paid', '2024-25'),
        (?, 'Tuition', 'Term 2', 15000, 7500, '2024-11-30', 'Partial', '2024-25'),
        (?, 'Exam', 'Annual', 1500, 1500, '2024-12-15', 'Paid', '2024-25'),
        (?, 'Library', 'Annual', 500, 0, '2025-01-31', 'Pending', '2024-25')
    `, [studentId, studentId, studentId, studentId]);

    // Seed transport fee
    await conn.query(`
      INSERT INTO transport_fees (student_id, route_name, pickup_point, vehicle_number, monthly_fee, months_paid, total_months, status)
      VALUES (?, 'Route A - City Center', 'Gandhi Nagar Stop', 'TN-01-AB-1234', 800, 6, 12, 'Active')
    `, [studentId]);

    // Seed some payment records
    const [[feeRow]] = await conn.query("SELECT id FROM fees WHERE student_id = ? AND fee_type = 'Tuition' AND term = 'Term 1'", [studentId]);
    if (feeRow) {
      const receiptNo = `RCP-${s.reg}-001`;
      await conn.query(`
        INSERT IGNORE INTO fee_payments (fee_id, student_id, receipt_number, amount, payment_date, payment_mode)
        VALUES (?, ?, ?, 15000, '2024-07-20', 'Online')
      `, [feeRow.id, studentId, receiptNo]);
    }

    console.log(`  ✓ Added student ${s.reg} (${s.name}) - login with DOB: ${s.dob}`);
  }

  // Also seed fees for existing student S101
  const [[s101]] = await conn.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.username = 'S101'");
  if (s101) {
    const [existingFees] = await conn.query('SELECT id FROM fees WHERE student_id = ?', [s101.id]);
    if (existingFees.length === 0) {
      await conn.query(`
        INSERT INTO fees (student_id, fee_type, term, total_amount, paid_amount, due_date, status, academic_year)
        VALUES
          (?, 'Tuition', 'Term 1', 15000, 15000, '2024-07-31', 'Paid', '2024-25'),
          (?, 'Tuition', 'Term 2', 15000, 15000, '2024-11-30', 'Paid', '2024-25'),
          (?, 'Tuition', 'Term 3', 15000, 0, '2025-03-31', 'Pending', '2024-25'),
          (?, 'Exam', 'Annual', 1500, 1500, '2024-12-15', 'Paid', '2024-25'),
          (?, 'Library', 'Annual', 500, 500, '2025-01-31', 'Paid', '2024-25'),
          (?, 'Lab', 'Annual', 800, 0, '2025-02-28', 'Pending', '2024-25')
      `, [s101.id, s101.id, s101.id, s101.id, s101.id, s101.id]);

      const [[fee1]] = await conn.query("SELECT id FROM fees WHERE student_id = ? AND fee_type = 'Tuition' AND term = 'Term 1'", [s101.id]);
      const [[fee2]] = await conn.query("SELECT id FROM fees WHERE student_id = ? AND fee_type = 'Tuition' AND term = 'Term 2'", [s101.id]);
      await conn.query(`INSERT IGNORE INTO fee_payments (fee_id, student_id, receipt_number, amount, payment_date, payment_mode) VALUES (?, ?, 'RCP-S101-001', 15000, '2024-07-15', 'Online')`, [fee1.id, s101.id]);
      await conn.query(`INSERT IGNORE INTO fee_payments (fee_id, student_id, receipt_number, amount, payment_date, payment_mode) VALUES (?, ?, 'RCP-S101-002', 15000, '2024-11-10', 'Cash')`, [fee2.id, s101.id]);

      await conn.query(`INSERT INTO transport_fees (student_id, route_name, pickup_point, vehicle_number, monthly_fee, months_paid, total_months, status)
        VALUES (?, 'Route B - North Zone', 'Park Avenue Stop', 'TN-02-CD-5678', 1000, 8, 12, 'Active')`, [s101.id]);

      console.log('  ✓ Seeded fees for S101');
    }
  }

  await conn.end();
  console.log('\nAll migrations completed successfully!');
  console.log('\nStudent Credentials:');
  console.log('  S101 → DOB: 2005-04-12');
  console.log('  S102 → DOB: 2006-03-18');
  console.log('  S103 → DOB: 2005-11-25');
  console.log('  S104 → DOB: 2006-01-14');
}

migrate().catch(err => { console.error('Migration error:', err.message); process.exit(1); });

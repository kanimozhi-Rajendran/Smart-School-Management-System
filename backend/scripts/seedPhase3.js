require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const FIRST_NAMES = ['Arjun','Priya','Ravi','Meena','Karthik','Divya','Suresh','Lakshmi','Arun','Kavya',
  'Vijay','Anitha','Bala','Nithya','Surya','Rekha','Ganesh','Uma','Senthil','Saranya',
  'Muthu','Pavithra','Kumar','Nandhini','Raj','Keerthana','Dinesh','Swetha','Siva','Deepa',
  'Harish','Yamuna','Bharath','Chitra','Mani','Saritha','Selvam','Veni','Prasad','Radha',
  'Ashwin','Sowmya','Naveen','Malathi','Praveen','Geetha','Mahesh','Vani','Ramesh','Subha'];

const LAST_NAMES = ['Kumar','Sharma','Raj','Devi','Murugan','Sundaram','Krishnan','Nair','Pillai','Reddy'];

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const RELIGIONS = ['Hindu','Christian','Muslim'];
const COMMUNITIES = ['BC','MBC','SC','ST','OC'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateDOB(minAge, maxAge) {
  const now = new Date();
  const year = now.getFullYear() - randomInt(minAge, maxAge);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    multipleStatements: true
  });

  console.log('🌱 Phase 3 Data Seeding...\n');

  // Get existing metadata
  const [classes] = await conn.query('SELECT * FROM classes');
  const [sections] = await conn.query('SELECT * FROM sections');
  const [subjects] = await conn.query('SELECT * FROM subjects');

  // Add more classes if needed
  const classNames = ['6th Standard','7th Standard','8th Standard','9th Standard','10th Standard','11th Standard','12th Standard'];
  for (const cn of classNames) {
    await conn.query('INSERT IGNORE INTO classes (class_name) VALUES (?)', [cn]);
  }
  const [allClasses] = await conn.query('SELECT * FROM classes');
  const [allSections] = await conn.query('SELECT * FROM sections');

  console.log(`  Classes: ${allClasses.length}, Sections: ${allSections.length}, Subjects: ${subjects.length}`);

  // ── Seed 5 Teachers ──────────────────────────────────
  const teacherData = [
    { tid: 'T101', name: 'John Doe',      subject: 'Tamil',         dept: 'Languages',    qual: 'M.A Tamil',         exp: 8,  email: 'john@school.com',   phone: '9876543210' },
    { tid: 'T102', name: 'Priya Anand',   subject: 'English',       dept: 'Languages',    qual: 'M.A English',       exp: 6,  email: 'priya@school.com',  phone: '9876543211' },
    { tid: 'T103', name: 'Ramesh Kumar',  subject: 'Maths',         dept: 'Mathematics',  qual: 'M.Sc Maths',        exp: 10, email: 'ramesh@school.com', phone: '9876543212' },
    { tid: 'T104', name: 'Anitha Raj',    subject: 'Science',       dept: 'Science',      qual: 'M.Sc Physics',      exp: 7,  email: 'anitha@school.com', phone: '9876543213' },
    { tid: 'T105', name: 'Suresh Babu',   subject: 'Social Science',dept: 'Social Studies',qual: 'M.A History',     exp: 9,  email: 'suresh@school.com', phone: '9876543214' },
  ];

  const teacherIds = {};
  for (const t of teacherData) {
    const [exists] = await conn.query('SELECT id FROM users WHERE username = ?', [t.tid]);
    if (exists.length === 0) {
      const hashed = await bcrypt.hash('teacher123', 10);
      const [ur] = await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [t.tid, hashed, 'teacher']);
      const sub = subjects.find(s => s.subject_name === t.subject);
      const [tr] = await conn.query(
        'INSERT INTO teachers (user_id, teacher_id, name, email, phone, department, designation, qualification, experience_yrs, subject_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ur.insertId, t.tid, t.name, t.email, t.phone, t.dept, 'Senior Teacher', t.qual, t.exp, sub?.id || null]
      );
      teacherIds[t.tid] = tr.insertId;
      console.log(`  ✓ Teacher ${t.tid} (${t.name})`);
    } else {
      const [[teacher]] = await conn.query('SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.username = ?', [t.tid]);
      if (teacher) teacherIds[t.tid] = teacher.id;
      console.log(`  - Teacher ${t.tid} already exists`);
    }
  }

  // ── Seed 50 Students ────────────────────────────────
  const [[existingCount]] = await conn.query('SELECT COUNT(*) as cnt FROM students');
  const studentsToAdd = Math.max(0, 50 - existingCount.cnt);
  console.log(`\n  Existing students: ${existingCount.cnt}, adding ${studentsToAdd} more...`);

  const studentIds = [];
  for (let i = 0; i < studentsToAdd; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const regNum = `S${String(existingCount.cnt + i + 1).padStart(3, '0')}`;
    const dob = generateDOB(14, 18);
    const gender = i % 2 === 0 ? 'Male' : 'Female';
    const classObj = allClasses[i % allClasses.length];
    const sectionObj = allSections[i % allSections.length];
    const rollNum = String(i + 1).padStart(2, '0');

    const [dupCheck] = await conn.query('SELECT id FROM users WHERE username = ?', [regNum]);
    if (dupCheck.length > 0) { studentIds.push(null); continue; }

    const hashed = await bcrypt.hash(dob, 10);
    const [ur] = await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [regNum, hashed, 'student']);
    const fatherName = `${LAST_NAMES[i % LAST_NAMES.length]} Senior`;
    const motherName = `${FIRST_NAMES[(i + 5) % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;

    const [sr] = await conn.query(
      `INSERT INTO students (user_id, register_number, name, dob, gender, father_name, mother_name, parent_mobile, address,
        class_id, section_id, blood_group, religion, community, admission_number, roll_number, admission_date, academic_year, parent_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ur.insertId, regNum, name, dob, gender, fatherName, motherName,
        `98765${String(40000 + i)}`, `${randomInt(1, 100)} Main Street, City`,
        classObj.id, sectionObj.id,
        randomItem(BLOOD_GROUPS), randomItem(RELIGIONS), randomItem(COMMUNITIES),
        `ADM2024${String(i + 1).padStart(4, '0')}`, rollNum,
        `2024-06-${String(randomInt(1, 15)).padStart(2, '0')}`, '2024-25',
        `parent${i + 1}@example.com`
      ]
    );
    studentIds.push(sr.insertId);

    // Parent record
    await conn.query(
      'INSERT IGNORE INTO parents (student_id, father_name, father_phone, father_email, father_occupation, mother_name, mother_phone, annual_income) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sr.insertId, fatherName, `98765${String(40000 + i)}`, `father${i + 1}@example.com`, randomItem(['Business','Govt Employee','Private','Farmer']),
       motherName, `98765${String(50000 + i)}`, randomInt(200000, 1500000)]
    );
  }
  console.log(`  ✓ Added ${studentIds.filter(Boolean).length} new students`);

  // ── Seed Marks for all students ──────────────────────
  const [allStudents] = await conn.query('SELECT id FROM students LIMIT 50');
  let marksAdded = 0;
  for (const s of allStudents) {
    for (const sub of subjects) {
      const marks = randomInt(45, 99);
      await conn.query(
        'INSERT IGNORE INTO marks (student_id, subject_id, marks_obtained) VALUES (?, ?, ?)',
        [s.id, sub.id, marks]
      );
      marksAdded++;
    }
  }
  console.log(`  ✓ Seeded ${marksAdded} mark records`);

  // ── Seed Attendance (last 30 days) ───────────────────
  const STATUSES = ['Present','Present','Present','Present','Absent','Late','Leave'];
  const allTeachers = Object.values(teacherIds);
  let attAdded = 0;
  for (let d = 29; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    const dow = date.getDay();
    if (dow === 0) continue; // Skip Sundays
    const dateStr = date.toISOString().split('T')[0];
    for (const s of allStudents.slice(0, 20)) { // limit for speed
      await conn.query(
        'INSERT IGNORE INTO attendance (student_id, date, status, edit_count, is_locked) VALUES (?, ?, ?, 1, 1)',
        [s.id, dateStr, randomItem(STATUSES)]
      );
      attAdded++;
    }
  }
  console.log(`  ✓ Seeded ~${attAdded} attendance records`);

  // ── Seed Timetable for 10th Standard ────────────────
  const [cls10] = await conn.query("SELECT id FROM classes WHERE class_name = '10th Standard'");
  const [secA] = await conn.query("SELECT id FROM sections WHERE section_name = 'A'");
  if (cls10.length > 0 && secA.length > 0) {
    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const subjectTeacherPairs = [];
    for (const sub of subjects) {
      const tid = Object.keys(teacherIds)[subjects.indexOf(sub) % Object.keys(teacherIds).length];
      subjectTeacherPairs.push({ subject_id: sub.id, teacher_id: teacherIds[tid] });
    }
    for (const day of DAYS) {
      for (let period = 1; period <= 6; period++) {
        const pair = subjectTeacherPairs[(period - 1) % subjectTeacherPairs.length];
        await conn.query(
          'INSERT IGNORE INTO timetable (class_id, section_id, day_of_week, period_number, subject_id, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
          [cls10[0].id, secA[0].id, day, period, pair.subject_id, pair.teacher_id]
        );
      }
    }
    console.log('  ✓ Seeded timetable for 10th Std Section A');
  }

  // ── Seed Assignments ─────────────────────────────────
  const [[asgCount]] = await conn.query('SELECT COUNT(*) as cnt FROM assignments');
  if (asgCount.cnt === 0 && cls10.length > 0) {
    const assignmentData = [
      { title: 'Tamil Essay Writing', subject: 'Tamil', priority: 'High', days: -3 },
      { title: 'English Grammar Exercise', subject: 'English', priority: 'Medium', days: 2 },
      { title: 'Algebra Problems - Chapter 5', subject: 'Maths', priority: 'High', days: 5 },
      { title: 'Science Lab Report', subject: 'Science', priority: 'Medium', days: 7 },
      { title: 'History Map Work', subject: 'Social Science', priority: 'Low', days: 10 },
    ];
    for (const a of assignmentData) {
      const sub = subjects.find(s => s.subject_name === a.subject);
      if (!sub) continue;
      const tid = Object.keys(teacherIds).find(k => teacherData.find(t => t.tid === k && t.subject === a.subject));
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + a.days);
      const [ar] = await conn.query(
        'INSERT INTO assignments (title, subject_id, class_id, section_id, teacher_id, description, instructions, due_date, max_marks, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [a.title, sub.id, cls10[0].id, secA[0].id, teacherIds[tid] || null,
         `Complete the ${a.title} as discussed in class.`, 'Submit in the given format.', dueDate.toISOString().split('T')[0], 20, a.priority, 'Published']
      );
      // Create submission records for students
      for (const s of allStudents.slice(0, 10)) {
        const status = Math.random() > 0.3 ? 'Submitted' : 'Pending';
        await conn.query(
          'INSERT IGNORE INTO assignment_submissions (assignment_id, student_id, status, marks_obtained, submitted_at) VALUES (?, ?, ?, ?, ?)',
          [ar.insertId, s.id, status, status === 'Submitted' ? randomInt(12, 20) : null, status === 'Submitted' ? new Date().toISOString() : null]
        );
      }
    }
    console.log('  ✓ Seeded 5 assignments with submissions');
  }

  // ── Seed Fee records for new students ────────────────
  const [studWithoutFees] = await conn.query(
    'SELECT s.id FROM students s LEFT JOIN fees f ON s.id = f.student_id WHERE f.id IS NULL LIMIT 30'
  );
  for (const s of studWithoutFees) {
    await conn.query(`
      INSERT INTO fees (student_id, fee_type, term, total_amount, paid_amount, due_date, status, academic_year)
      VALUES
        (?, 'Tuition', 'Term 1', 15000, 15000, '2024-07-31', 'Paid', '2024-25'),
        (?, 'Tuition', 'Term 2', 15000, ?, '2024-11-30', ?, '2024-25'),
        (?, 'Exam', 'Annual', 1500, ?, '2024-12-15', ?, '2024-25')
    `, [
      s.id,
      s.id, randomInt(0, 1) ? 15000 : 7500, randomInt(0, 1) ? 'Paid' : 'Partial',
      s.id, randomInt(0, 1) ? 1500 : 0, randomInt(0, 1) ? 'Paid' : 'Pending'
    ]);
  }
  console.log(`  ✓ Seeded fees for ${studWithoutFees.length} students`);

  // ── Seed Notifications ───────────────────────────────
  const [[notifCount]] = await conn.query('SELECT COUNT(*) as cnt FROM notifications WHERE category IS NOT NULL');
  if (notifCount.cnt < 5) {
    const notifs = [
      { title: 'Annual Sports Day', message: 'Annual Sports Day will be held on January 15, 2025. All students must participate.', role: 'all', category: 'Event', priority: 'Important', is_pinned: 1 },
      { title: 'Exam Schedule Released', message: 'Term 2 exam schedule has been published. Please check the timetable section.', role: 'student', category: 'Exam', priority: 'Urgent', is_pinned: 1 },
      { title: 'Staff Meeting', message: 'Monthly staff meeting on Friday at 4 PM in the conference hall.', role: 'teacher', category: 'Meeting', priority: 'Important', is_pinned: 0 },
      { title: 'Holiday Notice', message: 'School will remain closed on January 14 for Pongal festival.', role: 'all', category: 'Holiday', priority: 'Normal', is_pinned: 0 },
      { title: 'Fee Reminder', message: 'Term 2 fees due date is November 30. Please clear dues to avoid late fees.', role: 'student', category: 'Fees', priority: 'Important', is_pinned: 0 },
    ];
    for (const n of notifs) {
      await conn.query(
        'INSERT INTO notifications (title, message, role, category, priority, is_pinned) VALUES (?, ?, ?, ?, ?, ?)',
        [n.title, n.message, n.role, n.category, n.priority, n.is_pinned]
      );
    }
    console.log('  ✓ Seeded enhanced notifications');
  }

  // ── Seed Leave Applications for new students ─────────
  const LEAVE_TYPES = ['Sick Leave','Medical Leave','Casual Leave','Emergency Leave'];
  const LEAVE_STATUS = ['Pending','Approved','Rejected'];
  const [studForLeave] = await conn.query('SELECT id FROM students LIMIT 15');
  for (const s of studForLeave) {
    const [[lc]] = await conn.query('SELECT COUNT(*) as cnt FROM leave_applications WHERE student_id = ?', [s.id]);
    if (lc.cnt === 0) {
      const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - randomInt(5, 20));
      const toDate = new Date(fromDate); toDate.setDate(toDate.getDate() + randomInt(1, 3));
      await conn.query(
        'INSERT INTO leave_applications (student_id, type, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, randomItem(LEAVE_TYPES), fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0], 'Personal reason', randomItem(LEAVE_STATUS)]
      );
    }
  }
  console.log('  ✓ Seeded leave applications');

  await conn.end();
  console.log('\n🎉 Phase 3 seeding complete!\n');
  console.log('Summary:');
  console.log('  ✅ 50 students (across all classes)');
  console.log('  ✅ 5 teachers (one per subject)');
  console.log('  ✅ Attendance records (30 days)');
  console.log('  ✅ Marks for all students');
  console.log('  ✅ 5 assignments with submissions');
  console.log('  ✅ Fee records');
  console.log('  ✅ Leave applications');
  console.log('  ✅ Enhanced notifications');
  console.log('\nCredentials:');
  console.log('  Admin: admin / admin123');
  console.log('  Teachers: T101-T105 / teacher123');
  console.log('  Students: S101-S104 (existing) + new ones');
}

seed().catch(err => { console.error('Seed error:', err.message); process.exit(1); });

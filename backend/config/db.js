const mysql = require('mysql2/promise');
require('dotenv').config();

console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
console.log("DB_NAME =", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // This returns DATE columns as YYYY-MM-DD strings directly rather than UTC Date objects. Very useful for DOB and attendance date matching!
});

module.exports = pool;

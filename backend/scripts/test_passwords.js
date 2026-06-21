const mysql = require('mysql2/promise');

const passwords = [
  '', 'root', '123456', '12345678', '1234', 'admin', 'mysql', 'root123', 'root@123',
  'kanimozhi', 'Kanimozhi', 'kanimozhi@123', 'Kanimozhi@123', 'kanimozhi123', 'Kanimozhi123',
  'kani', 'Kani@123', 'Kani123', 'kani123', 'Kani'
];

async function test() {
  for (const pw of passwords) {
    try {
      console.log(`Trying password: "${pw}" on 127.0.0.1`);
      const conn = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: pw
      });
      console.log(`--> SUCCESS with password: "${pw}" on 127.0.0.1`);
      await conn.end();
      return;
    } catch (err) {
      console.log(`--> FAILED with password: "${pw}". Error code: ${err.code}, message: ${err.message}`);
    }
  }
}

test();

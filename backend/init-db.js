const { query } = require('./db');

async function initDb() {
  const createStudentsTable = `
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `;

  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      "sessionId" TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date DATE NOT NULL,
      "startTime" TIME NOT NULL,
      "endTime" TIME NOT NULL,
      "startDateTime" TIMESTAMPTZ NOT NULL,
      "endDateTime" TIMESTAMPTZ NOT NULL,
      "sessionType" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "expiryTime" TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      signature TEXT NOT NULL
    );
  `;

  const createAttendanceTable = `
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      "sessionId" TEXT REFERENCES sessions("sessionId") ON DELETE CASCADE,
      "sessionName" TEXT,
      "sessionDate" DATE,
      "studentId" TEXT REFERENCES students(id) ON DELETE CASCADE,
      "studentName" TEXT,
      "studentRole" TEXT,
      date DATE,
      "inTime" TIMESTAMPTZ,
      "outTime" TIMESTAMPTZ,
      duration INTEGER,
      status TEXT
    );
  `;

  try {
    console.log('Initializing database...');
    await query(createStudentsTable);
    console.log('Table "students" created or already exists.');
    await query(createSessionsTable);
    console.log('Table "sessions" created or already exists.');
    await query(createAttendanceTable);
    console.log('Table "attendance" created or already exists.');
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDb().catch(err => console.error(err));

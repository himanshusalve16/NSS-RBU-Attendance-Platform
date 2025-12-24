const { query } = require('./db');

// Students operations
async function getStudents() {
  const { rows } = await query('SELECT * FROM students ORDER BY name ASC');
  return rows;
}

async function getStudentById(studentId) {
  const { rows } = await query('SELECT * FROM students WHERE id = $1', [studentId]);
  return rows[0];
}

async function addStudent(student) {
  const { id, name, role } = student;
  const { rows } = await query('INSERT INTO students (id, name, role) VALUES ($1, $2, $3) RETURNING *', [id, name, role]);
  return rows[0];
}

async function updateStudent(studentId, updates) {
  const { name, role } = updates;
  const { rows } = await query('UPDATE students SET name = $1, role = $2 WHERE id = $3 RETURNING *', [name, role, studentId]);
  return rows[0];
}

async function deleteStudent(studentId) {
  const { rowCount } = await query('DELETE FROM students WHERE id = $1', [studentId]);
  return rowCount > 0;
}

// Sessions operations
async function getSessions() {
  const { rows } = await query('SELECT * FROM sessions ORDER BY "createdAt" DESC');
  return rows;
}

async function getSessionById(sessionId) {
  const { rows } = await query('SELECT * FROM sessions WHERE "sessionId" = $1', [sessionId]);
  return rows[0];
}

async function addSession(session) {
  const {
    sessionId, name, date, startTime, endTime, startDateTime, endDateTime,
    sessionType, createdAt, expiryTime, status, signature
  } = session;
  const { rows } = await query(`
    INSERT INTO sessions ("sessionId", name, date, "startTime", "endTime", "startDateTime", "endDateTime", "sessionType", "createdAt", "expiryTime", status, signature)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
  `, [sessionId, name, date, startTime, endTime, startDateTime, endDateTime, sessionType, createdAt, expiryTime, status, signature]);
  return rows[0];
}

async function updateSession(sessionId, updates) {
    const session = await getSessionById(sessionId);
    if (!session) return null;

    const newSession = { ...session, ...updates };
    const {
        name, date, startTime, endTime, startDateTime, endDateTime,
        sessionType, createdAt, expiryTime, status, signature
    } = newSession;

    const { rows } = await query(`
        UPDATE sessions SET
        name = $1, date = $2, "startTime" = $3, "endTime" = $4, "startDateTime" = $5, "endDateTime" = $6, "sessionType" = $7, "createdAt" = $8, "expiryTime" = $9, status = $10, signature = $11
        WHERE "sessionId" = $12 RETURNING *
    `, [name, date, startTime, endTime, startDateTime, endDateTime, sessionType, createdAt, expiryTime, status, signature, sessionId]);
    return rows[0];
}

async function deleteSession(sessionId) {
  const { rowCount } = await query('DELETE FROM sessions WHERE "sessionId" = $1', [sessionId]);
  return rowCount > 0;
}

// Attendance operations
async function getAttendance(filters = {}) {
  const { startDate, endDate, studentId, sessionId, role, name } = filters;
  let queryString = 'SELECT * FROM attendance';
  const queryParams = [];
  const whereClauses = [];

  if (startDate) {
    queryParams.push(startDate);
    whereClauses.push(`date >= $${queryParams.length}`);
  }
  if (endDate) {
    queryParams.push(endDate);
    whereClauses.push(`date <= $${queryParams.length}`);
  }
  if (studentId) {
    queryParams.push(studentId);
    whereClauses.push(`"studentId" = $${queryParams.length}`);
  }
  if (sessionId) {
    queryParams.push(sessionId);
    whereClauses.push(`"sessionId" = $${queryParams.length}`);
  }
  if (role) {
    queryParams.push(role);
    whereClauses.push(`"studentRole" = $${queryParams.length}`);
  }
  if (name) {
    queryParams.push(`%${name}%`);
    whereClauses.push(`"studentName" ILIKE $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryString += ' WHERE ' + whereClauses.join(' AND ');
  }

  queryString += ' ORDER BY "inTime" DESC';

  const { rows } = await query(queryString, queryParams);
  return rows;
}

async function getAttendanceById(attendanceId) {
  const { rows } = await query('SELECT * FROM attendance WHERE id = $1', [attendanceId]);
  return rows[0];
}

async function findAttendanceBySessionAndStudent(sessionId, studentId) {
    const { rows } = await query('SELECT * FROM attendance WHERE "sessionId" = $1 AND "studentId" = $2', [sessionId, studentId]);
    return rows[0];
}

async function addAttendance(attendance) {
  const {
    id, sessionId, sessionName, sessionDate, studentId, studentName, studentRole,
    date, inTime, outTime, duration, status
  } = attendance;
  const { rows } = await query(`
    INSERT INTO attendance (id, "sessionId", "sessionName", "sessionDate", "studentId", "studentName", "studentRole", date, "inTime", "outTime", duration, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
  `, [id, sessionId, sessionName, sessionDate, studentId, studentName, studentRole, date, inTime, outTime, duration, status]);
  return rows[0];
}

async function updateAttendance(attendanceId, updates) {
    const record = await getAttendanceById(attendanceId);
    if (!record) return null;

    const newRecord = { ...record, ...updates };
    const { outTime, duration, status } = newRecord;

    const { rows } = await query(`
        UPDATE attendance SET "outTime" = $1, duration = $2, status = $3
        WHERE id = $4 RETURNING *
    `, [outTime, duration, status, attendanceId]);
    return rows[0];
}

async function deleteAttendance(attendanceId) {
  const { rowCount } = await query('DELETE FROM attendance WHERE id = $1', [attendanceId]);
  return rowCount > 0;
}

module.exports = {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getSessions,
  getSessionById,
  addSession,
  updateSession,
  deleteSession,
  getAttendance,
  getAttendanceById,
  findAttendanceBySessionAndStudent,
  addAttendance,
  updateAttendance,
  deleteAttendance
};

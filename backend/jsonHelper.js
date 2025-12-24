const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Helper to read JSON file
function readJSON(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

// Helper to write JSON file safely
function writeJSON(filePath, data) {
  try {
    // Write to a temporary file first, then rename (atomic operation)
    const tempFile = filePath + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Students operations
function getStudents() {
  return readJSON(STUDENTS_FILE, []);
}

function addStudent(student) {
  const students = getStudents();
  students.push(student);
  return writeJSON(STUDENTS_FILE, students);
}

function getStudentByQR(qrText) {
  const students = getStudents();
  return students.find(s => s.qrText === qrText);
}

// Attendance operations
function getAttendance() {
  return readJSON(ATTENDANCE_FILE, []);
}

function addAttendance(attendance) {
  const attendanceList = getAttendance();
  attendanceList.push(attendance);
  return writeJSON(ATTENDANCE_FILE, attendanceList);
}

// Session operations
function getSessions() {
  return readJSON(SESSIONS_FILE, []);
}

function addSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  return writeJSON(SESSIONS_FILE, sessions);
}

function getSessionById(sessionId) {
  const sessions = getSessions();
  return sessions.find(s => s.sessionId === sessionId);
}

function updateSession(sessionId, updates) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.sessionId === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    return writeJSON(SESSIONS_FILE, sessions);
  }
  return false;
}

// Student operations (updated)
function getStudentById(studentId) {
  const students = getStudents();
  return students.find(s => s.id === studentId);
}

function updateStudent(studentId, updates) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    return writeJSON(STUDENTS_FILE, students);
  }
  return false;
}

function deleteStudent(studentId) {
  const students = getStudents();
  const studentExists = students.some(s => s.id === studentId);

  if (studentExists) {
    const filteredStudents = students.filter(s => s.id !== studentId);
    const writeStudentsSuccess = writeJSON(STUDENTS_FILE, filteredStudents);

    // Cascade delete to attendance records
    const attendance = getAttendance();
    const filteredAttendance = attendance.filter(a => a.studentId !== studentId);
    const writeAttendanceSuccess = writeJSON(ATTENDANCE_FILE, filteredAttendance);

    return writeStudentsSuccess && writeAttendanceSuccess;
  }
  return false; // Student not found
}

// Attendance operations (updated for In/Out model)
function getAttendanceById(attendanceId) {
  const attendance = getAttendance();
  return attendance.find(a => a.id === attendanceId);
}

function updateAttendance(attendanceId, updates) {
  const attendance = getAttendance();
  const index = attendance.findIndex(a => a.id === attendanceId);
  if (index !== -1) {
    attendance[index] = { ...attendance[index], ...updates };
    // Recalculate duration if inTime or outTime changed
    if (updates.inTime || updates.outTime) {
      const record = attendance[index];
      if (record.inTime && record.outTime) {
        const inTime = new Date(record.inTime);
        const outTime = new Date(record.outTime);
        record.duration = Math.round((outTime - inTime) / (1000 * 60)); // duration in minutes
        record.status = 'present';
      } else if (record.inTime) {
        record.status = 'partial';
        record.duration = null;
      } else {
        record.status = 'absent';
        record.duration = null;
      }
    }
    return writeJSON(ATTENDANCE_FILE, attendance);
  }
  return false;
}

function deleteAttendance(attendanceId) {
  const attendance = getAttendance();
  const initialLength = attendance.length;
  const filtered = attendance.filter(a => a.id !== attendanceId);

  if (filtered.length < initialLength) {
    return writeJSON(ATTENDANCE_FILE, filtered);
  }
  return false; // Attendance record not found
}

function deleteSession(sessionId) {
  const sessions = getSessions();
  const sessionExists = sessions.some(s => s.sessionId === sessionId);

  if (sessionExists) {
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    const writeSessionsSuccess = writeJSON(SESSIONS_FILE, filteredSessions);

    // Cascade delete to attendance records
    const attendance = getAttendance();
    const filteredAttendance = attendance.filter(a => a.sessionId !== sessionId);
    const writeAttendanceSuccess = writeJSON(ATTENDANCE_FILE, filteredAttendance);

    return writeSessionsSuccess && writeAttendanceSuccess;
  }
  return false; // Session not found
}

module.exports = {
  getStudents,
  addStudent,
  getStudentByQR,
  getStudentById,
  updateStudent,
  deleteStudent,
  getAttendance,
  addAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getSessions,
  addSession,
  getSessionById,
  updateSession,
  deleteSession
};


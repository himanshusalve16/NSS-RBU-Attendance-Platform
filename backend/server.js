const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query } = require('express-validator');
require('dotenv').config();
const QRCode = require('qrcode');
const {
  getStudents,
  addStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getAttendance,
  addAttendance,
  getSessions,
  addSession,
  getSessionById,
  updateSession
} = require('./jsonHelper');
const {
  verifyPassword,
  generateToken,
  verifyToken,
  removeToken,
  generateSignature,
  verifySignature,
  updatePassword
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Production security checks
if (NODE_ENV === 'production') {
  if (!process.env.SECRET_KEY || process.env.SECRET_KEY === 'your-secret-key-change-this-in-production') {
    console.error('❌ ERROR: SECRET_KEY must be set in production!');
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin123') {
    console.warn('⚠️  WARNING: ADMIN_PASSWORD should be changed from default in production!');
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      /\.vercel\.app$/, // Vercel preview and production
    ].filter(Boolean);
    
    // Check if origin matches any allowed origin
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else if (NODE_ENV === 'development') {
      // In development, allow all origins
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser with size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use(generalLimiter);

// Admin authentication middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !verifyToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Admin access required.'
    });
  }
  
  next();
}

// ==================== PUBLIC ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'QR Attendance System API is running',
    version: '1.0.0',
    health: '/health'
  });
});

// Admin login with validation and rate limiting
app.post('/login', loginLimiter, [
  body('password').trim().notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { password } = req.body;
    const isValid = await verifyPassword(password);
    
    if (isValid) {
      const token = generateToken();
      res.json({
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Admin logout
app.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      removeToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify session QR code (public - students use this)
app.post('/verify-session', (req, res) => {
  try {
    const { sessionId, expiryTime, signature } = req.body;
    
    if (!sessionId || !expiryTime || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing session data'
      });
    }

    // Verify signature
    if (!verifySignature(sessionId, expiryTime, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid QR code signature'
      });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(expiryTime);
    
    if (now > expiry) {
      return res.status(401).json({
        success: false,
        error: 'QR code has expired'
      });
    }

    // Verify session exists and is active
    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        name: session.name,
        expiryTime: session.expiryTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark attendance (public - students use this)
app.post('/mark-attendance', (req, res) => {
  try {
    const { sessionId, studentId, signature, expiryTime } = req.body;
    
    if (!sessionId || !studentId || !signature || !expiryTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, studentId, signature, expiryTime'
      });
    }

    // Verify signature
    if (!verifySignature(sessionId, expiryTime, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid QR code signature'
      });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(expiryTime);
    
    if (now > expiry) {
      return res.status(401).json({
        success: false,
        error: 'QR code has expired'
      });
    }

    // Verify session exists and is active
    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    // Get student
    const student = getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if already marked for this session
    const attendance = getAttendance();
    const existing = attendance.find(
      a => a.sessionId === sessionId && a.studentId === studentId
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for this session'
      });
    }

    // Mark attendance
    const attendanceRecord = {
      sessionId,
      sessionName: session.name,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.class,
      timestamp: new Date().toISOString(),
      status: 'present'
    };

    if (addAttendance(attendanceRecord)) {
      res.json({
        success: true,
        message: `Attendance marked for ${student.name}`,
        data: attendanceRecord
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save attendance' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Create a new session with validation
app.post('/admin/create-session', requireAdmin, [
  body('name').trim().notEmpty().withMessage('Session name is required').isLength({ min: 1, max: 200 }),
  body('durationMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, durationMinutes = 60 } = req.body;

    const sessionId = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiryTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
    
    const signature = generateSignature(sessionId, expiryTime.toISOString());

    const session = {
      sessionId,
      name,
      createdAt: now.toISOString(),
      expiryTime: expiryTime.toISOString(),
      durationMinutes,
      status: 'active',
      signature
    };

    if (addSession(session)) {
      // Generate QR code data
      const qrData = JSON.stringify({
        sessionId,
        expiryTime: expiryTime.toISOString(),
        signature
      });

      // Generate QR code image
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 1
        });

        res.json({
          success: true,
          message: 'Session created successfully',
          data: {
            ...session,
            qrCode: qrCodeDataURL,
            qrData: qrData
          }
        });
      } catch (qrError) {
        // If QR generation fails, still return session data
        res.json({
          success: true,
          message: 'Session created successfully (QR generation failed)',
          data: {
            ...session,
            qrData: qrData
          }
        });
      }
    } else {
      res.status(500).json({ success: false, error: 'Failed to create session' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all sessions
app.get('/admin/sessions', requireAdmin, (req, res) => {
  try {
    const sessions = getSessions();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
app.get('/admin/sessions/:sessionId', requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// End session
app.post('/admin/sessions/:sessionId/end', requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (updateSession(sessionId, { status: 'ended', endedAt: new Date().toISOString() })) {
      res.json({ success: true, message: 'Session ended successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students (admin only)
app.get('/admin/students', requireAdmin, (req, res) => {
  try {
    const students = getStudents();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new student (admin only)
app.post('/admin/students', requireAdmin, [
  body('id').trim().notEmpty().withMessage('Student ID is required').isLength({ min: 1, max: 50 }),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 1, max: 100 }),
  body('class').trim().notEmpty().withMessage('Class is required').isLength({ min: 1, max: 50 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { id, name, class: studentClass } = req.body;
    
    const students = getStudents();
    if (students.find(s => s.id === id)) {
      return res.status(400).json({
        success: false,
        error: 'Student ID already exists'
      });
    }

    const newStudent = { id, name, class: studentClass };
    if (addStudent(newStudent)) {
      res.json({ success: true, data: newStudent });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save student' });
    }
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ 
      success: false, 
      error: NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Update student (admin only)
app.put('/admin/students/:studentId', requireAdmin, (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, class: studentClass } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (studentClass) updates.class = studentClass;

    if (updateStudent(studentId, updates)) {
      const student = getStudentById(studentId);
      res.json({ success: true, data: student });
    } else {
      res.status(404).json({ success: false, error: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student (admin only)
app.delete('/admin/students/:studentId', requireAdmin, (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (deleteStudent(studentId)) {
      res.json({ success: true, message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all attendance records (admin only)
app.get('/admin/attendance', requireAdmin, (req, res) => {
  try {
    const attendance = getAttendance();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance by session (admin only)
app.get('/admin/attendance/session/:sessionId', requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const attendance = getAttendance();
    const sessionAttendance = attendance.filter(a => a.sessionId === sessionId);
    res.json({ success: true, data: sessionAttendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance in spreadsheet format (admin only)
app.get('/admin/attendance/spreadsheet', requireAdmin, (req, res) => {
  try {
    const { startDate, endDate, studentId, sessionId } = req.query;
    const attendance = getAttendance();
    const students = getStudents();
    const sessions = getSessions();

    // Filter attendance if needed
    let filteredAttendance = attendance;
    if (startDate) {
      filteredAttendance = filteredAttendance.filter(a => new Date(a.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredAttendance = filteredAttendance.filter(a => new Date(a.timestamp) <= new Date(endDate));
    }
    if (studentId) {
      filteredAttendance = filteredAttendance.filter(a => a.studentId === studentId);
    }
    if (sessionId) {
      filteredAttendance = filteredAttendance.filter(a => a.sessionId === sessionId);
    }

    // Group by student and session/date
    const studentMap = new Map();
    students.forEach(student => {
      studentMap.set(student.id, {
        id: student.id,
        name: student.name,
        class: student.class,
        sessions: new Map()
      });
    });

    filteredAttendance.forEach(record => {
      const student = studentMap.get(record.studentId);
      if (student) {
        const sessionKey = `${record.sessionId}_${record.sessionName}`;
        if (!student.sessions.has(sessionKey)) {
          student.sessions.set(sessionKey, {
            sessionId: record.sessionId,
            sessionName: record.sessionName,
            timestamp: record.timestamp,
            status: record.status
          });
        }
      }
    });

    // Get unique sessions/dates
    const uniqueSessions = new Set();
    filteredAttendance.forEach(record => {
      uniqueSessions.add(JSON.stringify({
        sessionId: record.sessionId,
        sessionName: record.sessionName,
        date: record.timestamp.split('T')[0]
      }));
    });

    const sessionList = Array.from(uniqueSessions).map(s => JSON.parse(s))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build spreadsheet data
    const spreadsheetData = Array.from(studentMap.values()).map(student => {
      const row = {
        studentId: student.id,
        name: student.name,
        class: student.class,
        sessions: {}
      };
      sessionList.forEach(session => {
        const sessionKey = `${session.sessionId}_${session.sessionName}`;
        const attendance = student.sessions.get(sessionKey);
        row.sessions[session.sessionId] = attendance ? 'Present' : 'Absent';
      });
      return row;
    });

    res.json({
      success: true,
      data: {
        students: spreadsheetData,
        sessions: sessionList,
        summary: {
          totalStudents: students.length,
          totalSessions: sessionList.length,
          totalRecords: filteredAttendance.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export attendance as CSV (admin only)
app.get('/admin/attendance/export/csv', requireAdmin, (req, res) => {
  try {
    const { startDate, endDate, studentId, sessionId } = req.query;
    const attendance = getAttendance();
    const students = getStudents();
    const sessions = getSessions();

    // Filter attendance if needed
    let filteredAttendance = attendance;
    if (startDate) {
      filteredAttendance = filteredAttendance.filter(a => new Date(a.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredAttendance = filteredAttendance.filter(a => new Date(a.timestamp) <= new Date(endDate));
    }
    if (studentId) {
      filteredAttendance = filteredAttendance.filter(a => a.studentId === studentId);
    }
    if (sessionId) {
      filteredAttendance = filteredAttendance.filter(a => a.sessionId === sessionId);
    }

    // Build CSV
    let csv = 'Student ID,Name,Class,Session Name,Date,Time,Status\n';
    filteredAttendance.forEach(record => {
      const date = new Date(record.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      csv += `"${record.studentId}","${record.studentName}","${record.studentClass}","${record.sessionName || record.sessionId}","${dateStr}","${timeStr}","${record.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance analytics (admin only)
app.get('/admin/attendance/analytics', requireAdmin, (req, res) => {
  try {
    const attendance = getAttendance();
    const students = getStudents();
    const sessions = getSessions();

    // Calculate analytics
    const totalSessions = sessions.length;
    const totalRecords = attendance.length;
    const uniqueStudents = new Set(attendance.map(a => a.studentId)).size;

    // Per-student analytics
    const studentAnalytics = students.map(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const presentCount = studentAttendance.length;
      const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions * 100).toFixed(2) : 0;
      const absentCount = totalSessions - presentCount;

      return {
        studentId: student.id,
        name: student.name,
        class: student.class,
        present: presentCount,
        absent: absentCount,
        percentage: parseFloat(attendancePercentage),
        isLowAttendance: parseFloat(attendancePercentage) < 75
      };
    });

    // Overall statistics
    const overallStats = {
      totalStudents: students.length,
      totalSessions: totalSessions,
      totalAttendanceRecords: totalRecords,
      averageAttendance: totalSessions > 0 ? (totalRecords / (students.length * totalSessions) * 100).toFixed(2) : 0,
      lowAttendanceStudents: studentAnalytics.filter(s => s.isLowAttendance).length
    };

    res.json({
      success: true,
      data: {
        overall: overallStats,
        students: studentAnalytics
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${__dirname}/data/`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔐 Default admin password: admin123`);
  console.log(`   (Set ADMIN_PASSWORD env variable to change)`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

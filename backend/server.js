const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query, matchedData } = require('express-validator');
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
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getSessions,
  addSession,
  getSessionById,
  updateSession,
  deleteSession,
  findAttendanceBySessionAndStudent
} = require('./dbHelper');
const {
  verifyPassword,
  generateToken,
  verifyToken,
  removeToken,
  generateSignature,
  verifySignature
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
    console.warn('   Set ADMIN_PASSWORD environment variable to change the password.');
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
      /\.vercel\.app$/, // Vercel preview and production domains
      /^https:\/\/.*\.vercel\.app$/, // Vercel production
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
      // In production, log the origin for debugging
      console.log('CORS blocked origin:', origin);
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
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Get sanitized data from express-validator (this includes trimmed values)
    const sanitizedData = matchedData(req, { locations: ['body'] });
    const password = sanitizedData.password || req.body.password || '';
    const trimmedPassword = password.trim();
    
    // Debug logging (only in development)
    if (NODE_ENV === 'development') {
      console.log('Login attempt - Password received:', `"${trimmedPassword}"`);
      console.log('Password length:', trimmedPassword.length);
      console.log('Expected password:', `"${process.env.ADMIN_PASSWORD || 'admin123'}"`);
      console.log('Password match:', trimmedPassword === (process.env.ADMIN_PASSWORD || 'admin123'));
    }
    
    const isValid = verifyPassword(trimmedPassword);
    
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
app.post('/verify-session', async (req, res) => {
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
    const session = await getSessionById(sessionId);
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

// Mark attendance (public - Core Members and Volunteers use this)
// Single QR code handles both In and Out times
app.post('/mark-attendance', async (req, res) => {
  try {
    const { sessionId, studentId, signature, expiryTime } = req.body;
    
    // Debug logging in development
    if (NODE_ENV === 'development') {
      console.log('Mark attendance request:', { sessionId, studentId, hasSignature: !!signature, hasExpiryTime: !!expiryTime });
    }
    
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

    // Check expiry - lock attendance after session expiry
    const now = new Date();
    const expiry = new Date(expiryTime);
    
    if (now > expiry) {
      return res.status(401).json({
        success: false,
        error: 'QR code has expired. Attendance is now locked.'
      });
    }

    // Verify session exists and is active
    const session = await getSessionById(sessionId);
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

    // Get student/participant
    const student = await getStudentById(studentId);
    if (!student) {
      if (NODE_ENV === 'development') {
        console.log('Student not found for ID:', studentId);
      }
      return res.status(404).json({
        success: false,
        error: `Participant not found with ID: ${studentId}. Please ensure the participant is registered in the system.`
      });
    }

    // Check role compatibility with session type
    const studentRole = student.role || 'Volunteer'; // Default to Volunteer if role not set
    
    if (NODE_ENV === 'development') {
      console.log('Role check - Session type:', session.sessionType, 'Student role:', studentRole);
    }
    
    if (session.sessionType === 'Core' && studentRole !== 'Core Member') {
      return res.status(403).json({
        success: false,
        error: `This session is for Core Members only. Your role is: ${studentRole}`
      });
    }
    if (session.sessionType === 'Volunteer' && studentRole !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        error: `This session is for Volunteers only. Your role is: ${studentRole}`
      });
    }

    // Check existing attendance record
    const existing = await findAttendanceBySessionAndStudent(sessionId, studentId);

    const serverTimestamp = new Date().toISOString(); // Server-generated timestamp

    if (!existing) {
      // First scan - Mark In Time
      const attendanceRecord = {
        id: `ATT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        sessionName: session.name,
        sessionDate: session.date,
        studentId: student.id,
        studentName: student.name,
        studentRole: studentRole,
        date: session.date,
        inTime: serverTimestamp,
        outTime: null,
        duration: null,
        status: 'partial' // Partial because no out time yet
      };

      const newRecord = await addAttendance(attendanceRecord);
      if (newRecord) {
        res.json({
          success: true,
          message: `In time marked for ${student.name}`,
          action: 'in',
          data: newRecord
        });
      } else {
        res.status(500).json({ success: false, error: 'Failed to save attendance' });
      }
    } else {
      // Second scan - Mark Out Time (only if in time exists and out time is null)
      if (!existing.inTime) {
        return res.status(400).json({
          success: false,
          error: 'Cannot mark out time without in time'
        });
      }

      if (existing.outTime) {
        return res.status(400).json({
          success: false,
          error: 'Attendance already completed for this session'
        });
      }

      // Calculate duration
      const inTime = new Date(existing.inTime);
      const outTime = new Date(serverTimestamp);
      const duration = Math.round((outTime - inTime) / (1000 * 60)); // duration in minutes

      const updatedRecord = await updateAttendance(existing.id, { outTime: serverTimestamp, duration, status: 'present' });

      if (updatedRecord) {
        res.json({
          success: true,
          message: `Out time marked for ${student.name}`,
          action: 'out',
          data: updatedRecord
        });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update attendance' });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Create a new session with validation
app.post('/admin/create-session', requireAdmin, [
  body('name').trim().notEmpty().withMessage('Session name is required').isLength({ min: 1, max: 200 }),
  body('date').trim().notEmpty().withMessage('Date is required'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
  body('sessionType').isIn(['Core', 'Volunteer', 'Both']).withMessage('Session type must be Core, Volunteer, or Both')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, date, startTime, endTime, sessionType } = req.body;

    // Validate date and times
    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Combine date with start/end times
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format'
      });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    const sessionId = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    // Use end time as expiry time
    const signature = generateSignature(sessionId, endDateTime.toISOString());

    const sessionData = {
      sessionId,
      name,
      date: date,
      startTime: startTime,
      endTime: endTime,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      sessionType, // 'Core', 'Volunteer', or 'Both'
      createdAt: now.toISOString(),
      expiryTime: endDateTime.toISOString(),
      status: 'active',
      signature
    };

    const newSession = await addSession(sessionData);

    if (newSession) {
      // Generate QR code data
      const qrData = JSON.stringify({
        sessionId,
        expiryTime: endDateTime.toISOString(),
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
            ...newSession,
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
            ...newSession,
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
app.get('/admin/sessions', requireAdmin, async (req, res) => {
  try {
    const sessions = await getSessions();
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
app.get('/admin/sessions/:sessionId', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);
    
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
app.post('/admin/sessions/:sessionId/end', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const updatedSession = await updateSession(sessionId, { status: 'ended', endedAt: new Date().toISOString() });

    if (updatedSession) {
      res.json({ success: true, message: 'Session ended successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students (admin only)
app.get('/admin/students', requireAdmin, async (req, res) => {
  try {
    const students = await getStudents();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new student/participant (admin only)
app.post('/admin/students', requireAdmin, [
  body('id').trim().notEmpty().withMessage('ID is required').isLength({ min: 1, max: 50 }),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 1, max: 100 }),
  body('role').isIn(['Admin', 'Core Member', 'Volunteer']).withMessage('Role must be Admin, Core Member, or Volunteer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { id, name, role } = req.body;
    
    const existingStudent = await getStudentById(id);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'ID already exists'
      });
    }

    const newStudent = { id, name, role };
    const createdStudent = await addStudent(newStudent);
    if (createdStudent) {
      res.json({ success: true, data: createdStudent });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save participant' });
    }
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ 
      success: false, 
      error: NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Update student/participant (admin only)
app.put('/admin/students/:studentId', requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, role } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (role) {
      if (!['Admin', 'Core Member', 'Volunteer'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role must be Admin, Core Member, or Volunteer'
        });
      }
      updates.role = role;
    }

    const updatedStudent = await updateStudent(studentId, updates);

    if (updatedStudent) {
      res.json({ success: true, data: updatedStudent });
    } else {
      res.status(404).json({ success: false, error: 'Participant not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student (admin only)
app.delete('/admin/students/:studentId', requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (await deleteStudent(studentId)) {
      res.json({ success: true, message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete session (admin only)
app.delete('/admin/sessions/:sessionId', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (await deleteSession(sessionId)) {
      res.json({ success: true, message: 'Session deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session (admin only)
app.put('/admin/sessions/:sessionId', requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('date').optional().trim().notEmpty(),
  body('startTime').optional().trim().notEmpty(),
  body('endTime').optional().trim().notEmpty(),
  body('sessionType').optional().isIn(['Core', 'Volunteer', 'Both']),
  body('status').optional().isIn(['active', 'ended', 'expired'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { sessionId } = req.params;
    const updates = {};
    
    if (req.body.name) updates.name = req.body.name;
    if (req.body.date) updates.date = req.body.date;
    if (req.body.startTime) updates.startTime = req.body.startTime;
    if (req.body.endTime) updates.endTime = req.body.endTime;
    if (req.body.sessionType) updates.sessionType = req.body.sessionType;
    if (req.body.status) updates.status = req.body.status;

    const updatedSession = await updateSession(sessionId, updates);

    if (updatedSession) {
      res.json({ success: true, data: updatedSession });
    } else {
      res.status(404).json({ success: false, error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attendance record (admin only - edit In/Out times)
app.put('/admin/attendance/:attendanceId', requireAdmin, [
  body('inTime').optional().trim().notEmpty(),
  body('outTime').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { attendanceId } = req.params;
    const updates = {};
    
    if (req.body.inTime) {
      const inTime = new Date(req.body.inTime);
      if (isNaN(inTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid inTime format'
        });
      }
      updates.inTime = inTime.toISOString();
    }
    
    if (req.body.outTime !== undefined) {
      if (req.body.outTime === null || req.body.outTime === '') {
        updates.outTime = null;
      } else {
        const outTime = new Date(req.body.outTime);
        if (isNaN(outTime.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid outTime format'
          });
        }
        updates.outTime = outTime.toISOString();
      }
    }

    const updatedAttendance = await updateAttendance(attendanceId, updates);

    if (updatedAttendance) {
      res.json({ success: true, data: updatedAttendance });
    } else {
      res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attendance record (admin only)
app.delete('/admin/attendance/:attendanceId', requireAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    if (await deleteAttendance(attendanceId)) {
      res.json({ success: true, message: 'Attendance record deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all attendance records (admin only)
// Supports filtering: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&studentId=ID&sessionId=ID&role=Role&name=Name
app.get('/admin/attendance', requireAdmin, async (req, res) => {
  try {
    const attendance = await getAttendance(req.query);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance by session (admin only)
app.get('/admin/attendance/session/:sessionId', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionAttendance = await getAttendance({ sessionId });
    res.json({ success: true, data: sessionAttendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance in spreadsheet format (admin only)
// Supports role filtering: ?role=Core Member or ?role=Volunteer
app.get('/admin/attendance/export/csv', requireAdmin, async (req, res) => {
  try {
    const attendance = await getAttendance(req.query);

    const header = [
      'ID', 'SessionID', 'SessionName', 'SessionDate', 'StudentID', 'StudentName', 'StudentRole',
      'InTime', 'OutTime', 'Duration(min)', 'Status'
    ].join(',');

    const rows = attendance.map(record => {
      const formatCsvDate = (isoString) => {
        if (!isoString) return '';
        try {
          return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          }).replace(',', '');
        } catch (e) {
          return '';
        }
      };

      const rowData = [
        record.id,
        record.sessionId,
        `"${record.sessionName || ''}"`,
        record.sessionDate ? new Date(record.sessionDate).toISOString().split('T')[0] : '',
        record.studentId,
        `"${record.studentName || ''}"`,
        record.studentRole || '',
        formatCsvDate(record.inTime),
        formatCsvDate(record.outTime),
        record.duration || 0,
        record.status || 'absent'
      ];
      return rowData.join(',');
    }).join('\n');

    const csv = `${header}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);

  } catch (error) {

    // Filter students by role if specified
    const filteredStudents = role ? allStudents.filter(s => s.role === role) : allStudents;

    // Group by student and session/date
    const studentMap = new Map();
    filteredStudents.forEach(student => {
      studentMap.set(student.id, {
        id: student.id,
        name: student.name,
        role: student.role || 'Volunteer',
        sessions: new Map()
      });
    });

    attendance.forEach(record => {
      const student = studentMap.get(record.studentId);
      if (student) {
        const sessionKey = `${record.sessionId}_${record.sessionName}`;
        if (!student.sessions.has(sessionKey)) {
          student.sessions.set(sessionKey, {
            id: record.id,
            duration: record.duration || 0,
            status: record.status || 'absent'
          });
        }
      }
    });

    // Convert maps to arrays for JSON response
    const spreadsheetData = Array.from(studentMap.values()).map(student => {
      return {
        ...student,
        sessions: Object.fromEntries(student.sessions)
      };
    });

    // Get unique sessions for header
    const uniqueSessions = allSessions.map(s => ({
      id: s.sessionId,
      name: s.name,
      date: s.date
    }));

    res.json({
      success: true,
      data: {
        students: spreadsheetData,
        sessions: uniqueSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export attendance as CSV (admin only)
// Supports role filtering: ?role=Core Member or ?role=Volunteer
app.get('/admin/attendance/export/csv', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, studentId, sessionId, role } = req.query;
    const attendance = await getAttendance(req.query);
    const students = await getStudents();
    const sessions = await getSessions();

    // Filter attendance if needed
    let filteredAttendance = attendance;
    if (startDate) {
      filteredAttendance = filteredAttendance.filter(a => {
        const recordDate = a.date || (a.inTime ? a.inTime.split('T')[0] : null);
        return recordDate && new Date(recordDate) >= new Date(startDate);
      });
    }
    if (endDate) {
      filteredAttendance = filteredAttendance.filter(a => {
        const recordDate = a.date || (a.inTime ? a.inTime.split('T')[0] : null);
        return recordDate && new Date(recordDate) <= new Date(endDate);
      });
    }
    if (studentId) {
      filteredAttendance = filteredAttendance.filter(a => a.studentId === studentId);
    }
    if (sessionId) {
      filteredAttendance = filteredAttendance.filter(a => a.sessionId === sessionId);
    }
    if (role) {
      filteredAttendance = filteredAttendance.filter(a => a.studentRole === role);
    }

    // Build CSV with In/Out times
    let csv = 'ID,Name,Role,Session Name,Date,In Time,Out Time,Duration (minutes),Status\n';
    filteredAttendance.forEach(record => {
      const date = record.date || (record.inTime ? record.inTime.split('T')[0] : 'N/A');
      const inTime = record.inTime ? new Date(record.inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
      const outTime = record.outTime ? new Date(record.outTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
      const duration = record.duration ? record.duration.toString() : '-';
      csv += `"${record.studentId}","${record.studentName}","${record.studentRole || 'Volunteer'}","${record.sessionName || record.sessionId}","${date}","${inTime}","${outTime}","${duration}","${record.status}"\n`;
    });

    const roleSuffix = role ? `_${role.replace(' ', '_')}` : '';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance${roleSuffix}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance analytics (admin only)
app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [students, attendance, sessions] = await Promise.all([
      getStudents(),
      getAttendance(),
      getSessions()
    ]);

    const totalRecords = attendance.length;
    const totalSessions = sessions.length;
    
    // Calculate attendance percentage per student
    const studentAnalytics = students.map(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const presentCount = studentAttendance.length;
      const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions * 100).toFixed(2) : 0;
      const isLowAttendance = parseFloat(attendancePercentage) < 50;

      return {
        id: student.id,
        name: student.name,
        role: student.role,
        presentCount,
        attendancePercentage,
        isLowAttendance
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
  const currentPassword = process.env.ADMIN_PASSWORD || 'admin123';
  console.log(`🔐 Admin password: ${currentPassword}`);
  console.log(`   (Set ADMIN_PASSWORD env variable to change)`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

# QR-Based Attendance System (Session-Based)

A complete offline/LAN QR-based attendance monitoring system with **session-based QR codes** and **admin authentication**. Built with React.js (JSX) frontend and Node.js + Express + JSON file storage backend. No external databases or third-party services required.

## 🎯 Features

- ✅ **Session-Based QR Codes** - One QR code per class session (not per student)
- ✅ **Secure QR Codes** - Server-signed QR codes with expiry time to prevent reuse
- ✅ **Admin Authentication** - Password-based login system for admin access
- ✅ **Role-Based Access** - Separate admin and student interfaces
- ✅ **Session Management** - Create, view, and manage attendance sessions
- ✅ **Student Management** - Add, edit, and delete students (admin only)
- ✅ **Attendance Tracking** - View all attendance records with filtering
- ✅ **Spreadsheet View** - Excel-style attendance tracking (students × sessions)
- ✅ **CSV Export** - Export attendance data as CSV/Excel files
- ✅ **Analytics Dashboard** - View attendance statistics and percentages
- ✅ **Low Attendance Alerts** - Automatically highlight students below 75% attendance
- ✅ **Print-Friendly Sheets** - Generate printable attendance reports
- ✅ **Secure Password Storage** - Passwords hashed with bcrypt
- ✅ **Fully Offline/LAN** - Works completely offline or on local network
- ✅ **No External Services** - No Firebase, MongoDB, or cloud dependencies
- ✅ **JSON File Storage** - Simple, local data storage
- ✅ **Responsive Design** - Works on desktop and mobile devices

## 🔐 Security Features

- **Signed QR Codes**: Each QR code contains a cryptographic signature to prevent forgery
- **Expiry Time**: QR codes automatically expire after the set duration
- **Session Validation**: Server validates QR codes before accepting attendance
- **Admin Protection**: All admin routes require authentication
- **Duplicate Prevention**: Students cannot mark attendance twice for the same session

## 📁 Project Structure

```
Attendance/
├── frontend/              # React.js frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── StudentScanner.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminSessions.jsx
│   │   │   ├── AdminAttendance.jsx
│   │   │   ├── AdminStudents.jsx
│   │   │   └── AttendanceSpreadsheet.jsx
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── App.jsx        # Main app with routing
│   │   ├── api.js         # API client
│   │   └── config.js      # API configuration
│   ├── package.json
│   └── vite.config.js
├── backend/              # Node.js backend
│   ├── data/             # JSON data storage
│   │   ├── students.json
│   │   ├── attendance.json
│   │   └── sessions.json
│   ├── server.js         # Express server
│   ├── auth.js           # Authentication & signing (bcrypt)
│   ├── jsonHelper.js     # JSON file operations
│   └── data/
│       └── auth.json     # Hashed password storage
│   └── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A webcam (for QR scanning on mobile/desktop)

### Step 1: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set admin password via environment variable:
```bash
# Windows PowerShell
$env:ADMIN_PASSWORD="your-secure-password"

# Windows CMD
set ADMIN_PASSWORD=your-secure-password

# Linux/Mac
export ADMIN_PASSWORD=your-secure-password
```
**Default password:** `admin123` (change this in production!)

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API URL for LAN access:
   - Create a `.env` file in `frontend/` directory:
   ```
   VITE_API_URL=http://YOUR_COMPUTER_IP:5000
   ```
   Replace `YOUR_COMPUTER_IP` with your computer's IP address (e.g., `192.168.1.100`)

4. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📱 Usage Guide

### For Administrators

1. **Login**
   - Go to `http://localhost:3000` (home page)
   - Click "Show Login" in the admin section
   - Enter admin password (default: `admin123`)
   - You'll be redirected to the admin dashboard

2. **Create a Session**
   - Click "Create New Session" on the dashboard
   - Enter session name (e.g., "Math Class - Dec 7")
   - Set duration in minutes (default: 60 minutes)
   - Click "Create Session & Generate QR"
   - A QR code will be displayed in a new window - **print or display this for students**

3. **Manage Students**
   - Go to "Manage Students" page
   - Add new students with ID, Name, and Class
   - Edit or delete existing students

4. **View Attendance**
   - Go to "View Attendance" page for detailed records
   - Go to "Spreadsheet View" for Excel-style tracking
   - Filter by: Date range, Student ID, or Session
   - Export to CSV for external analysis
   - Print attendance sheets
   - View analytics: total presents, absents, percentages
   - Low attendance students (<75%) are automatically highlighted

5. **Manage Sessions**
   - Go to "Manage Sessions" page
   - View all created sessions
   - End active sessions manually if needed

### For Students

1. **Mark Attendance**
   - Go to `http://localhost:3000/scan` (or your LAN IP)
   - Enter your Student ID (e.g., S001)
   - Click "Start Scanning"
   - Point camera at the session QR code displayed by the teacher
   - Attendance will be automatically marked

2. **Manual Entry** (if camera doesn't work)
   - Enter your Student ID
   - Paste the QR code JSON data in the manual input field
   - Click "Submit"

## 🔧 API Endpoints

### Public Endpoints

- `POST /login` - Admin login
- `POST /logout` - Admin logout
- `POST /verify-session` - Verify session QR code
- `POST /mark-attendance` - Mark attendance (students)

### Admin Endpoints (Requires Authentication)

- `POST /admin/create-session` - Create new session
- `GET /admin/sessions` - Get all sessions
- `GET /admin/sessions/:sessionId` - Get session by ID
- `POST /admin/sessions/:sessionId/end` - End a session
- `GET /admin/students` - Get all students
- `POST /admin/students` - Add new student
- `PUT /admin/students/:studentId` - Update student
- `DELETE /admin/students/:studentId` - Delete student
- `GET /admin/attendance` - Get all attendance records
- `GET /admin/attendance/session/:sessionId` - Get attendance by session

## 🔒 How Session QR Codes Work

1. **Admin creates a session** → Server generates:
   - Unique `sessionId`
   - `expiryTime` (current time + duration)
   - Cryptographic `signature` (SHA-256 hash of sessionId + expiryTime + secret key)

2. **QR Code contains:**
   ```json
   {
     "sessionId": "SESSION_1234567890_abc123",
     "expiryTime": "2025-12-07T10:30:00.000Z",
     "signature": "a1b2c3d4e5f6..."
   }
   ```

3. **Student scans QR code** → System:
   - Verifies signature (prevents forgery)
   - Checks expiry time (prevents reuse of old codes)
   - Validates session is active
   - Marks attendance with student ID

## 🌐 LAN Access Setup

To allow other devices (like mobile phones) to access the system:

1. **Find your computer's IP address:**
   - Windows: Open Command Prompt and type `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **Update frontend API URL:**
   - Create `.env` file in `frontend/` directory:
   ```
   VITE_API_URL=http://YOUR_IP:5000
   ```

3. **Start both servers:**
   - Backend: `npm start` (in backend folder)
   - Frontend: `npm start` (in frontend folder)

4. **Access from mobile:**
   - Open browser on mobile device
   - Go to `http://YOUR_IP:3000`
   - Make sure mobile device is on the same network

## 📊 Sample Data

The system comes with 10 pre-configured students:

- S001 - John Doe (Class 10A)
- S002 - Jane Smith (Class 10A)
- S003 - Michael Johnson (Class 10B)
- S004 - Emily Davis (Class 10B)
- S005 - David Wilson (Class 11A)
- S006 - Sarah Brown (Class 11A)
- S007 - Robert Taylor (Class 11B)
- S008 - Lisa Anderson (Class 11B)
- S009 - James Martinez (Class 12A)
- S010 - Maria Garcia (Class 12A)

## 🔒 Data Storage

All data is stored in JSON files:
- `backend/data/students.json` - Student information
- `backend/data/attendance.json` - Attendance records
- `backend/data/sessions.json` - Session information

Data is safely written using atomic file operations to prevent corruption.

## 🛠️ Troubleshooting

### Cannot login
- Default password is `admin123`
- Check browser console for errors
- Make sure backend is running

### Camera not working
- Make sure you've granted camera permissions in your browser
- Try using a different browser (Chrome recommended)
- Check if another application is using the camera
- Use the manual input option as alternative

### Cannot connect to backend
- Make sure backend server is running on port 5000
- Check if the API URL in `frontend/src/config.js` is correct
- For LAN access, ensure firewall allows connections on port 5000

### QR code not working
- Make sure QR code hasn't expired
- Check that session is still active
- Verify you're using the correct Student ID
- Try refreshing the page

### Session expired
- QR codes automatically expire after the set duration
- Create a new session to generate a new QR code

## 🔐 Security Notes

- **Change the default password** in production by setting `ADMIN_PASSWORD` environment variable
- **Change the secret key** in `backend/auth.js` for production use
- QR codes are signed but not encrypted - they can be read but not forged
- Sessions expire automatically based on the duration set
- Students cannot mark attendance twice for the same session

## 🚀 Production Deployment

### Using PM2 (Recommended)

PM2 is a process manager for Node.js applications that keeps your app running in the background.

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Start backend with PM2:**
```bash
cd backend
pm2 start server.js --name "attendance-backend"
```

3. **Start frontend with PM2 (if using production build):**
```bash
cd frontend
npm run build
pm2 serve dist 3000 --name "attendance-frontend" --spa
```

4. **PM2 Commands:**
```bash
# View running processes
pm2 list

# View logs
pm2 logs attendance-backend

# Restart application
pm2 restart attendance-backend

# Stop application
pm2 stop attendance-backend

# Delete application
pm2 delete attendance-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Environment Variables for Production

Create a `.env` file in the `backend/` directory:

```env
ADMIN_PASSWORD=your-secure-password-here
SECRET_KEY=your-secret-key-for-qr-signing
PORT=5000
```

### Running as a Service (Linux)

1. Create a systemd service file `/etc/systemd/system/attendance-backend.service`:

```ini
[Unit]
Description=Attendance System Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Attendance/backend
Environment="NODE_ENV=production"
Environment="ADMIN_PASSWORD=your-secure-password"
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:
```bash
sudo systemctl enable attendance-backend
sudo systemctl start attendance-backend
sudo systemctl status attendance-backend
```

### Security Best Practices

1. **Change default password** - Set `ADMIN_PASSWORD` environment variable
2. **Use strong secret key** - Set `SECRET_KEY` environment variable
3. **Enable HTTPS** - Use a reverse proxy (nginx) with SSL certificate
4. **Firewall rules** - Only allow necessary ports (5000 for backend, 3000 for frontend)
5. **Regular backups** - Backup `backend/data/` directory regularly
6. **Monitor logs** - Check PM2 logs regularly for errors

## 📝 Notes

- All data is stored locally - no cloud services
- Works completely offline (after initial setup)
- QR codes are generated as data URLs (can be printed or displayed)
- The system supports any number of students and sessions
- Sessions can be manually ended by admin before expiry
- **Password is now hashed using bcrypt** for secure storage
- **Spreadsheet view** provides Excel-like attendance tracking
- **CSV export** available for data analysis
- **Low attendance highlighting** automatically marks students below 75%

## 🎓 License

This project is open source and available for educational use.

---

**Made with ❤️ for secure, offline attendance tracking**

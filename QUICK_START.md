# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm start
```
Server runs on `http://localhost:5000`
**Default admin password:** `admin123`

### 3. Install Frontend Dependencies (New Terminal)
```bash
cd frontend
npm install
```

### 4. Start Frontend
```bash
npm start
```
Frontend runs on `http://localhost:3000`

### 5. Login as Admin
1. Go to `http://localhost:3000/login`
2. Enter password: `admin123`
3. You'll see the admin dashboard

### 6. Create Your First Session
1. Click "Create New Session" on the dashboard
2. Enter a name (e.g., "Math Class")
3. Set duration (e.g., 60 minutes)
4. Click "Create Session & Generate QR"
5. **Print or display the QR code** for students to scan

### 7. Test Student Attendance
1. Open a new browser tab/window (or use mobile)
2. Go to `http://localhost:3000/scan`
3. Enter a Student ID (e.g., `S001`)
4. Click "Start Scanning"
5. Scan the QR code you just created
6. Attendance will be marked!

## 📱 For Mobile/LAN Access

1. Find your computer's IP address:
   - Windows: `ipconfig` in Command Prompt
   - Look for "IPv4 Address"

2. Create `.env` file in `frontend/` folder:
   ```
   VITE_API_URL=http://YOUR_IP:5000
   ```

3. Restart frontend server

4. Access from mobile: `http://YOUR_IP:3000`

## ✅ Test the System

1. **Admin Side:**
   - Login at `/login`
   - Create a session
   - View attendance at `/admin/attendance`

2. **Student Side:**
   - Go to `/scan`
   - Enter Student ID: `S001`
   - Scan the session QR code
   - Check attendance was recorded

## 🎯 Key Features

- **One QR per session** - All students scan the same QR code
- **Secure** - QR codes expire and are cryptographically signed
- **Admin only** - Only admins can create sessions and manage students
- **Student simple** - Students just scan and enter their ID

## 🔐 Security

- Default password: `admin123` (change via `ADMIN_PASSWORD` env variable)
- QR codes expire after set duration
- Server validates all QR codes before accepting attendance
- Students cannot reuse old QR codes

---

**Ready to track attendance!** 🎉

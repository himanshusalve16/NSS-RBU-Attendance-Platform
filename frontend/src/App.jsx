import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import StudentScanner from './pages/StudentScanner'
import AdminDashboard from './pages/AdminDashboard'
import AdminSessions from './pages/AdminSessions'
import AdminAttendance from './pages/AdminAttendance'
import AdminStudents from './pages/AdminStudents'
import AttendanceSpreadsheet from './pages/AttendanceSpreadsheet'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
      <Route path="/scan" element={<StudentScanner />} />
      <Route path="/home" element={<Home />} />
      
      {/* Admin routes (protected) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute>
            <AdminSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance/spreadsheet"
        element={
          <ProtectedRoute>
            <AttendanceSpreadsheet />
          </ProtectedRoute>
        }
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <main className="w-full overflow-x-hidden">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

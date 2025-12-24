import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, getStudents, getAttendance, createSession } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    totalAttendance: 0,
    activeSessions: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '09:00',
    endTime: '17:00',
    sessionType: 'Both' // 'Core', 'Volunteer', or 'Both'
  })
  const { logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [sessionsRes, studentsRes, attendanceRes] = await Promise.all([
        getSessions(),
        getStudents(),
        getAttendance()
      ])

      const sessions = sessionsRes.data || []
      const students = studentsRes.data || []
      const attendance = attendanceRes.data || []
      
      const activeSessions = sessions.filter(s => s.status === 'active' && new Date(s.expiryTime) > new Date())

      setStats({
        totalStudents: students.length,
        totalSessions: sessions.length,
        totalAttendance: attendance.length,
        activeSessions: activeSessions.length
      })
    } catch (err) {
      error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()

    try {
      const response = await createSession(sessionForm)
      if (response.success) {
        success('Session created successfully!')
        setSessionForm({ 
          name: '', 
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          sessionType: 'Both'
        })
        setShowCreateSession(false)
        fetchStats()
        
        // Show QR code in a modal or new window
        if (response.data.qrCode) {
          const newWindow = window.open('', '_blank', 'width=500,height=600')
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Session QR Code - ${sessionForm.name}</title>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center; 
                    padding: 40px 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                  }
                  .container {
                    background: white;
                    color: #333;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 400px;
                    margin: 0 auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                  }
                  h2 { margin: 0 0 10px 0; color: #667eea; }
                  img { max-width: 100%; margin: 20px 0; border-radius: 10px; }
                  button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                  }
                  button:hover { opacity: 0.9; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>${sessionForm.name}</h2>
                  <p style="color: #666; margin-bottom: 10px;">${sessionForm.date} | ${sessionForm.startTime} - ${sessionForm.endTime}</p>
                  <p style="color: #666; margin-bottom: 20px;">Type: ${sessionForm.sessionType}</p>
                  <p style="color: #666; margin-bottom: 20px;">Scan this QR code to mark In/Out time</p>
                  <img src="${response.data.qrCode}" alt="QR Code" />
                  <p style="color: #999; font-size: 12px; margin-top: 15px;">Valid until ${new Date(response.data.endDateTime).toLocaleString()}</p>
                  <button onclick="window.print()">🖨️ Print QR Code</button>
                </div>
              </body>
            </html>
          `)
        }
      } else {
        error(response.error || 'Failed to create session')
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error creating session')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6 sm:mb-8">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage your attendance system</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base min-h-[44px]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8 md:pb-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Students</p>
                <p className="text-3xl sm:text-4xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Sessions</p>
                <p className="text-3xl sm:text-4xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Active Sessions</p>
                <p className="text-3xl sm:text-4xl font-bold">{stats.activeSessions}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Total Attendance</p>
                <p className="text-3xl sm:text-4xl font-bold">{stats.totalAttendance}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Session */}
        {showCreateSession ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Session</h2>
              <button
                  onClick={() => {
                    setShowCreateSession(false)
                    setSessionForm({ 
                      name: '', 
                      date: new Date().toISOString().split('T')[0],
                      startTime: '09:00',
                      endTime: '17:00',
                      sessionType: 'Both'
                    })
                  }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
                  placeholder="e.g., Weekly Meeting"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Session Type *
                </label>
                <select
                  value={sessionForm.sessionType}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
                >
                  <option value="Core">Core Members Only</option>
                  <option value="Volunteer">Volunteers Only</option>
                  <option value="Both">Both Core & Volunteers</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 sm:py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-base sm:text-lg min-h-[44px]"
                >
                  Create Session & Generate QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSession(false)
                    setSessionForm({ 
                      name: '', 
                      date: new Date().toISOString().split('T')[0],
                      startTime: '09:00',
                      endTime: '17:00',
                      sessionType: 'Both'
                    })
                  }}
                  className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-300 text-base sm:text-lg min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <button
              onClick={() => setShowCreateSession(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-base sm:text-lg min-h-[44px]"
            >
              <span className="text-lg sm:text-xl">+</span>
              <span>Create New Session</span>
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link
            to="/admin/sessions"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white transform hover:scale-105 transition-all group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <span className="text-4xl sm:text-5xl">📅</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Manage Sessions</h3>
            <p className="text-sm sm:text-base text-blue-100">View and manage all attendance sessions</p>
          </Link>

          <Link
            to="/admin/attendance"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white transform hover:scale-105 transition-all group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <span className="text-4xl sm:text-5xl">📋</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">View Attendance</h3>
            <p className="text-sm sm:text-base text-green-100">See all attendance records and history</p>
          </Link>

          <Link
            to="/admin/attendance/spreadsheet"
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white transform hover:scale-105 transition-all group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <span className="text-4xl sm:text-5xl">📊</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Spreadsheet View</h3>
            <p className="text-sm sm:text-base text-orange-100">Excel-style attendance tracking</p>
          </Link>

          <Link
            to="/admin/students"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white transform hover:scale-105 transition-all group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <span className="text-4xl sm:text-5xl">👨‍🎓</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Manage Students</h3>
            <p className="text-sm sm:text-base text-purple-100">Add, edit, or remove students</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

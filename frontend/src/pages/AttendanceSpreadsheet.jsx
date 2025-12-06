import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAttendanceSpreadsheet, getAttendanceAnalytics, exportAttendanceCSV } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AttendanceSpreadsheet() {
  const [spreadsheetData, setSpreadsheetData] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    studentId: '',
    sessionId: ''
  })
  const { logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (currentFilters = filters) => {
    try {
      const [spreadsheetRes, analyticsRes] = await Promise.all([
        getAttendanceSpreadsheet(currentFilters),
        getAttendanceAnalytics()
      ])
      setSpreadsheetData(spreadsheetRes.data)
      setAnalytics(analyticsRes.data)
    } catch (err) {
      error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setLoading(true)
    fetchData(filters).finally(() => setLoading(false))
  }

  const handleExportCSV = async () => {
    try {
      const response = await exportAttendanceCSV(filters)
      const blob = new Blob([response], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success('CSV exported successfully!')
    } catch (err) {
      error('Failed to export CSV')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (!spreadsheetData || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
          <p className="text-gray-600 text-base sm:text-lg">No data available</p>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Spreadsheet</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Excel-style attendance tracking</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 no-print">
              <Link
                to="/admin/dashboard"
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-300 text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
              >
                ← Dashboard
              </Link>
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all text-sm sm:text-base min-h-[44px]"
              >
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm sm:text-base min-h-[44px]"
              >
                Print
              </button>
              <button
                onClick={logout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8 md:pb-10">
        {/* Analytics Summary */}
        {analytics.overall && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 no-print">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analytics.overall.totalStudents}</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Total Sessions</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{analytics.overall.totalSessions}</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Avg. Attendance</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{analytics.overall.averageAttendance}%</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Low Attendance</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{analytics.overall.lowAttendanceStudents}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Student ID</label>
              <input
                type="text"
                value={filters.studentId}
                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                placeholder="e.g., S001"
                className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-2 px-4 sm:px-6 rounded-xl transition-all text-sm sm:text-base min-h-[44px]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100 print:shadow-none">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200 print:border-collapse">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border print:border-gray-300">
                      Student ID
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border print:border-gray-300">
                      Name
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border print:border-gray-300 hidden sm:table-cell">
                      Class
                    </th>
                    {spreadsheetData.sessions.map((session, idx) => (
                      <th
                        key={idx}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border print:border-gray-300 hidden md:table-cell"
                      >
                        <div className="whitespace-nowrap">{session.sessionName}</div>
                        <div className="text-xs text-gray-400 font-normal">{session.date}</div>
                      </th>
                    ))}
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border print:border-gray-300">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spreadsheetData.students.map((student, studentIdx) => {
                    const studentAnalytic = analytics.students.find(s => s.studentId === student.studentId)
                    const isLowAttendance = studentAnalytic?.isLowAttendance || false
                    
                    return (
                      <tr
                        key={studentIdx}
                        className={`hover:bg-gray-50 transition-colors ${isLowAttendance ? 'bg-red-50 print:bg-white' : ''}`}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border print:border-gray-300">
                          {student.studentId}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 border print:border-gray-300">
                          {student.name}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 border print:border-gray-300 hidden sm:table-cell">
                          {student.class}
                        </td>
                        {spreadsheetData.sessions.map((session, sessionIdx) => {
                          const status = student.sessions[session.sessionId] || 'Absent'
                          return (
                            <td
                              key={sessionIdx}
                              className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center border print:border-gray-300 hidden md:table-cell ${
                                status === 'Present'
                                  ? 'bg-green-100 text-green-800 print:bg-white print:text-gray-900'
                                  : 'bg-red-100 text-red-800 print:bg-white print:text-gray-900'
                              }`}
                            >
                              {status === 'Present' ? '✓' : '✗'}
                            </td>
                          )
                        })}
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium border print:border-gray-300 ${
                          isLowAttendance ? 'text-red-600 font-bold' : 'text-gray-900'
                        }`}>
                          {studentAnalytic?.percentage || 0}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 no-print">
          <p>Total: <span className="font-bold text-orange-600">{spreadsheetData.summary.totalStudents}</span> students, <span className="font-bold text-orange-600">{spreadsheetData.summary.totalSessions}</span> sessions</p>
          {analytics.overall.lowAttendanceStudents > 0 && (
            <p className="text-red-600 mt-1 sm:mt-2">
              ⚠️ {analytics.overall.lowAttendanceStudents} student(s) with low attendance (&lt;75%)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceSpreadsheet

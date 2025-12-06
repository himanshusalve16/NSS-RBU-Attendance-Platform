import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAttendance } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AdminAttendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { logout } = useAuth()
  const { toasts, removeToast, error } = useToast()

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await getAttendance()
      const data = response.data || []
      const sorted = data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      setAttendance(sorted)
    } catch (err) {
      error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const filterAttendance = () => {
    if (filter === 'all') return attendance

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return attendance.filter(record => {
      const recordDate = new Date(record.timestamp)
      
      switch (filter) {
        case 'today':
          return recordDate >= today
        case 'thisWeek':
          return recordDate >= weekAgo
        case 'thisMonth':
          return recordDate >= monthAgo
        default:
          return true
      }
    })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading attendance records...</p>
        </div>
      </div>
    )
  }

  const filteredAttendance = filterAttendance()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6 sm:mb-8">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Records</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View all attendance history</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <Link
                to="/admin/dashboard"
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-300 text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
              >
                ← Dashboard
              </Link>
              <button
                onClick={fetchAttendance}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm sm:text-base min-h-[44px]"
              >
                Refresh
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
        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-xl transition text-sm sm:text-base min-h-[44px] ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-xl transition text-sm sm:text-base min-h-[44px] ${
                filter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('thisWeek')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-xl transition text-sm sm:text-base min-h-[44px] ${
                filter === 'thisWeek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('thisMonth')}
              className={`px-4 sm:px-6 py-2.5 sm:py-2 rounded-xl transition text-sm sm:text-base min-h-[44px] ${
                filter === 'thisMonth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl sm:text-4xl">📋</span>
            </div>
            <p className="text-gray-600 text-base sm:text-lg mb-2">No attendance records found.</p>
            <p className="text-sm sm:text-base text-gray-500">Start creating sessions to track attendance.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider hidden sm:table-cell">
                        Class
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider hidden md:table-cell">
                        Date & Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.map((record, index) => (
                      <tr key={index} className="hover:bg-green-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <div className="font-medium">{record.sessionName || record.sessionId}</div>
                          <div className="text-gray-500 text-xs md:hidden mt-1">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                          {record.studentId}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {record.studentName}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                          {record.studentClass}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          {formatDate(record.timestamp)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
          Showing <span className="font-bold text-green-600">{filteredAttendance.length}</span> of <span className="font-bold">{attendance.length}</span> records
        </div>
      </div>
    </div>
  )
}

export default AdminAttendance

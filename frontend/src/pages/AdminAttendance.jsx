import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAttendanceWithFilters, updateAttendance, deleteAttendance, getSessions, getStudents } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AdminAttendance() {
  const [attendance, setAttendance] = useState([])
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sessionId: '',
    role: '',
    name: ''
  })
  const { logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchData()
    fetchAttendance()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [filters])

  const fetchData = async () => {
    try {
      const [sessionsRes, studentsRes] = await Promise.all([
        getSessions(),
        getStudents()
      ])
      setSessions(sessionsRes.data || [])
      setStudents(studentsRes.data || [])
    } catch (err) {
      error('Failed to load data')
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await getAttendanceWithFilters(filters)
      const data = response.data || []
      const sorted = data.sort((a, b) => {
        const dateA = a.date || (a.inTime ? a.inTime.split('T')[0] : '')
        const dateB = b.date || (b.inTime ? b.inTime.split('T')[0] : '')
        if (dateA !== dateB) return dateB.localeCompare(dateA)
        return new Date(b.inTime || 0) - new Date(a.inTime || 0)
      })
      setAttendance(sorted)
    } catch (err) {
      error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleEdit = (record) => {
    setEditingRecord({
      ...record,
      inTime: record.inTime ? new Date(record.inTime).toISOString().slice(0, 16) : '',
      outTime: record.outTime ? new Date(record.outTime).toISOString().slice(0, 16) : ''
    })
  }

  const handleSaveEdit = async () => {
    try {
      const updates = {}
      if (editingRecord.inTime) {
        updates.inTime = new Date(editingRecord.inTime).toISOString()
      }
      if (editingRecord.outTime !== undefined) {
        updates.outTime = editingRecord.outTime ? new Date(editingRecord.outTime).toISOString() : null
      }

      const response = await updateAttendance(editingRecord.id, updates)
      if (response.success) {
        success('Attendance record updated successfully!')
        setEditingRecord(null)
        fetchAttendance()
      } else {
        error(response.error || 'Failed to update record')
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error updating record')
    }
  }

  const handleDelete = async (attendanceId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return
    }

    try {
      const response = await deleteAttendance(attendanceId)
      if (response.success) {
        success('Attendance record deleted successfully!')
        fetchAttendance()
      } else {
        error(response.error || 'Failed to delete record')
      }
    } catch (err) {
      error(err.response?.data?.error || 'Error deleting record')
    }
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const getStatusBadge = (record) => {
    if (record.status === 'present') {
      return <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Present</span>
    } else if (record.status === 'partial') {
      return <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>
    } else {
      return <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Absent</span>
    }
  }

  if (loading && attendance.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading attendance records...</p>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Records</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View, edit, and manage attendance</p>
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
        {/* Advanced Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Session</label>
              <select
                value={filters.sessionId}
                onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              >
                <option value="">All Roles</option>
                <option value="Core Member">Core Member</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Search by name"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', sessionId: '', role: '', name: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all text-sm min-h-[44px]"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Attendance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">In Time</label>
                  <input
                    type="datetime-local"
                    value={editingRecord.inTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, inTime: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Out Time</label>
                  <input
                    type="datetime-local"
                    value={editingRecord.outTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, outTime: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                  />
                  <button
                    onClick={() => setEditingRecord({ ...editingRecord, outTime: '' })}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Clear Out Time
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition-all min-h-[44px]"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl hover:bg-gray-300 transition-all min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {attendance.length > 0 ? (
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
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider hidden sm:table-cell">
                        Role
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        In Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Out Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider hidden md:table-cell">
                        Duration
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record, index) => (
                      <tr key={index} className="hover:bg-green-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <div className="font-medium">{record.sessionName || record.sessionId}</div>
                          <div className="text-gray-500 text-xs">{record.date || (record.inTime ? record.inTime.split('T')[0] : '')}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                          {record.studentName}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                          {record.studentRole || 'Volunteer'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatTime(record.inTime)}
                          {!record.inTime && <span className="text-red-500">Missing</span>}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatTime(record.outTime)}
                          {record.inTime && !record.outTime && <span className="text-yellow-600 ml-1">⚠️</span>}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          {record.duration ? `${record.duration} min` : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {getStatusBadge(record)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl sm:text-4xl">📋</span>
            </div>
            <p className="text-gray-600 text-base sm:text-lg mb-2">No attendance records found.</p>
            <p className="text-sm sm:text-base text-gray-500 mb-4">Adjust filters or start creating sessions to track attendance.</p>
            <div className="text-xs text-gray-400 mt-4">
              <p>Tip: Make sure participants have scanned QR codes to mark attendance.</p>
              <p>Check that sessions are active and participants have the correct role for the session type.</p>
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
          Showing <span className="font-bold text-green-600">{attendance.length}</span> record{attendance.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

export default AdminAttendance

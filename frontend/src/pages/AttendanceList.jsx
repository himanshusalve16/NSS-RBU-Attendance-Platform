import React, { useState, useEffect } from 'react'
import { getAttendance } from '../api'

function AttendanceList() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, thisWeek, thisMonth

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await getAttendance()
      const data = response.data || []
      // Sort by timestamp, newest first
      const sorted = data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      setAttendance(sorted)
    } catch (error) {
      console.error('Error fetching attendance:', error)
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
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading attendance records...</div>
      </div>
    )
  }

  const filteredAttendance = filterAttendance()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Records</h1>
        <button
          onClick={fetchAttendance}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('thisWeek')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'thisWeek'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('thisMonth')}
            className={`px-4 py-2 rounded-lg transition ${
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
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No attendance records found.</p>
          <p className="text-gray-500 mt-2">Start scanning QR codes to mark attendance.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.studentClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredAttendance.length} of {attendance.length} records
      </div>
    </div>
  )
}

export default AttendanceList


import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, getAttendance } from '../api'

function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAttendance: 0,
    todayAttendance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        getStudents(),
        getAttendance()
      ])

      const students = studentsRes.data || []
      const attendance = attendanceRes.data || []
      
      const today = new Date().toISOString().split('T')[0]
      const todayRecords = attendance.filter(record => 
        record.timestamp && record.timestamp.startsWith(today)
      )

      setStats({
        totalStudents: students.length,
        totalAttendance: attendance.length,
        todayAttendance: todayRecords.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Attendance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalAttendance}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today's Attendance</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.todayAttendance}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/scanner"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md p-8 text-center transition transform hover:scale-105"
        >
          <div className="text-5xl mb-4">📷</div>
          <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
          <p className="text-blue-100">Mark attendance by scanning student QR codes</p>
        </Link>

        <Link
          to="/attendance"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md p-8 text-center transition transform hover:scale-105"
        >
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-bold mb-2">View Attendance</h2>
          <p className="text-green-100">See all attendance records and history</p>
        </Link>

        <Link
          to="/students"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md p-8 text-center transition transform hover:scale-105"
        >
          <div className="text-5xl mb-4">👨‍🎓</div>
          <h2 className="text-2xl font-bold mb-2">Manage Students</h2>
          <p className="text-purple-100">View and manage student information</p>
        </Link>

        <div className="bg-gray-100 rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">ℹ️</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Quick Info</h2>
          <p className="text-gray-600">
            Use the QR Scanner to mark attendance quickly. All data is stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSessions, endSession, deleteSession } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function AdminSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const { logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await getSessions()
      const data = response.data || []
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setSessions(sorted)
    } catch (err) {
      error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return
    }

    try {
      await endSession(sessionId)
      success('Session ended successfully!')
      fetchSessions()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to end session')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone and will delete all associated attendance records.')) {
      return
    }

    try {
      await deleteSession(sessionId)
      success('Session deleted successfully!')
      fetchSessions()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete session')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const isExpired = (expiryTime) => {
    return new Date() > new Date(expiryTime)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading sessions...</p>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">📅</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sessions</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage all attendance sessions</p>
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
                onClick={fetchSessions}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-200 text-blue-700 font-semibold rounded-xl transition-all hover:bg-blue-300 text-sm sm:text-base min-h-[44px]"
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
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl sm:text-4xl">📅</span>
            </div>
            <p className="text-gray-600 text-base sm:text-lg mb-2">No sessions found.</p>
            <p className="text-sm sm:text-base text-gray-500 mb-6">Create a new session from the dashboard.</p>
            <Link
              to="/admin/dashboard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl text-sm sm:text-base min-h-[44px] flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Session Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider hidden md:table-cell">
                        Created
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider hidden lg:table-cell">
                        Expires
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider hidden md:table-cell">
                        Date & Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider hidden lg:table-cell">
                        Type
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session, index) => {
                      const expired = isExpired(session.expiryTime)
                      const isActive = session.status === 'active' && !expired
                      
                      return (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                            <div className="font-medium">{session.name}</div>
                            <div className="text-gray-500 text-xs md:hidden mt-1">
                              Created: {new Date(session.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500 text-xs lg:hidden md:block hidden mt-1">
                              Expires: {new Date(session.expiryTime).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {formatDate(session.createdAt)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            <div>{session.date || 'N/A'}</div>
                            <div className="text-xs text-gray-400">
                              {session.startTime} - {session.endTime}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {session.sessionType || 'Both'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {isActive ? (
                              <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                {session.status === 'ended' ? 'Ended' : 'Expired'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {isActive && (
                                <button
                                  onClick={() => handleEndSession(session.sessionId)}
                                  className="text-orange-600 hover:text-orange-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                                >
                                  End
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSession(session.sessionId)}
                                className="text-red-600 hover:text-red-800 font-semibold transition-colors text-left sm:text-center min-h-[44px] sm:min-h-0 px-2 sm:px-0"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSessions

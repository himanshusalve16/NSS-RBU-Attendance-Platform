import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, logout as apiLogout } from '../api'
import { useAuth } from '../context/AuthContext'
import StudentScanner from './StudentScanner'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, login: setAuth, logout } = useAuth()
  const { toasts, removeToast, success, error } = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await login(password)
      if (response.success) {
        setAuth(response.token)
        success('Login successful!')
        setPassword('')
        setShowLogin(false)
      } else {
        error(response.error || 'Login failed')
      }
    } catch (err) {
      error(err.response?.data?.error || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiLogout()
      logout()
      success('Logged out successfully!')
      setShowLogin(false)
    } catch (err) {
      // Even if API call fails, clear local auth
      logout()
      success('Logged out successfully!')
      setShowLogin(false)
    }
  }

  const handleLoginButtonClick = () => {
    if (isAuthenticated) {
      handleLogout()
    } else {
      setShowLogin(!showLogin)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header - Responsive padding */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-xl sm:text-2xl">📱</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">QR Attendance System</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Secure & Simple Attendance Tracking</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Go to Dashboard
                </button>
              )}
              <button
                onClick={handleLoginButtonClick}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {showLogin ? 'Hide Login' : isAuthenticated ? 'Logout' : 'Admin Login'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-10">
        {/* Admin Login Section */}
        {showLogin && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl sm:text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
                <p className="text-sm sm:text-base text-gray-600">Enter your password to access the admin panel</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter admin password"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 sm:py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base sm:text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login as Admin'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Student Scanner Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl sm:text-4xl">📷</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Mark Your Attendance</h2>
            <p className="text-base sm:text-lg text-gray-600">Scan the QR code displayed by your teacher</p>
          </div>
          <StudentScanner />
        </div>
      </div>
    </div>
  )
}

export default Home

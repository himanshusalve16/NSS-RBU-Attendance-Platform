import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  const login = (token) => {
    localStorage.setItem('adminToken', token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    login,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


import axios from 'axios'
import API_BASE_URL from './config'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ==================== AUTH ====================
export const login = async (password) => {
  const response = await api.post('/login', { password })
  return response.data
}

export const logout = async () => {
  const response = await api.post('/logout')
  return response.data
}

// ==================== SESSIONS ====================
export const createSession = async (sessionData) => {
  const response = await api.post('/admin/create-session', sessionData)
  return response.data
}

export const getSessions = async () => {
  const response = await api.get('/admin/sessions')
  return response.data
}

export const getSession = async (sessionId) => {
  const response = await api.get(`/admin/sessions/${sessionId}`)
  return response.data
}

export const endSession = async (sessionId) => {
  const response = await api.post(`/admin/sessions/${sessionId}/end`)
  return response.data
}

// ==================== ATTENDANCE ====================
export const markAttendance = async (attendanceData) => {
  const response = await api.post('/mark-attendance', attendanceData)
  return response.data
}

export const verifySession = async (sessionData) => {
  const response = await api.post('/verify-session', sessionData)
  return response.data
}

export const getAttendance = async () => {
  const response = await api.get('/admin/attendance')
  return response.data
}

export const getAttendanceBySession = async (sessionId) => {
  const response = await api.get(`/admin/attendance/session/${sessionId}`)
  return response.data
}

export const getAttendanceSpreadsheet = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.studentId) params.append('studentId', filters.studentId)
  if (filters.sessionId) params.append('sessionId', filters.sessionId)
  const response = await api.get(`/admin/attendance/spreadsheet?${params.toString()}`)
  return response.data
}

export const getAttendanceAnalytics = async () => {
  const response = await api.get('/admin/attendance/analytics')
  return response.data
}

export const exportAttendanceCSV = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.studentId) params.append('studentId', filters.studentId)
  if (filters.sessionId) params.append('sessionId', filters.sessionId)
  const response = await api.get(`/admin/attendance/export/csv?${params.toString()}`, {
    responseType: 'blob'
  })
  return response.data
}

// ==================== STUDENTS ====================
export const getStudents = async () => {
  const response = await api.get('/admin/students')
  return response.data
}

export const addStudent = async (studentData) => {
  const response = await api.post('/admin/students', studentData)
  return response.data
}

export const updateStudent = async (studentId, studentData) => {
  const response = await api.put(`/admin/students/${studentId}`, studentData)
  return response.data
}

export const deleteStudent = async (studentId) => {
  const response = await api.delete(`/admin/students/${studentId}`)
  return response.data
}

// ==================== SESSION MANAGEMENT ====================
export const updateSession = async (sessionId, sessionData) => {
  const response = await api.put(`/admin/sessions/${sessionId}`, sessionData)
  return response.data
}

export const deleteSession = async (sessionId) => {
  const response = await api.delete(`/admin/sessions/${sessionId}`)
  return response.data
}

// ==================== ATTENDANCE MANAGEMENT ====================
export const updateAttendance = async (attendanceId, attendanceData) => {
  const response = await api.put(`/admin/attendance/${attendanceId}`, attendanceData)
  return response.data
}

export const deleteAttendance = async (attendanceId) => {
  const response = await api.delete(`/admin/attendance/${attendanceId}`)
  return response.data
}

export const getAttendanceWithFilters = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.studentId) params.append('studentId', filters.studentId)
  if (filters.sessionId) params.append('sessionId', filters.sessionId)
  if (filters.role) params.append('role', filters.role)
  if (filters.name) params.append('name', filters.name)
  const response = await api.get(`/admin/attendance?${params.toString()}`)
  return response.data
}

export const getAttendanceSpreadsheetWithRole = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.studentId) params.append('studentId', filters.studentId)
  if (filters.sessionId) params.append('sessionId', filters.sessionId)
  if (filters.role) params.append('role', filters.role)
  const response = await api.get(`/admin/attendance/spreadsheet?${params.toString()}`)
  return response.data
}

export const exportAttendanceCSVWithRole = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.studentId) params.append('studentId', filters.studentId)
  if (filters.sessionId) params.append('sessionId', filters.sessionId)
  if (filters.role) params.append('role', filters.role)
  const response = await api.get(`/admin/attendance/export/csv?${params.toString()}`, {
    responseType: 'blob'
  })
  return response.data
}
// API Configuration
// For production, set VITE_API_URL environment variable in Vercel
// For local development, defaults to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : '')

// Throw error if API URL is not set in production
if (!import.meta.env.DEV && !API_BASE_URL) {
  console.error('VITE_API_URL environment variable is not set! Please configure it in Vercel.')
}

export default API_BASE_URL


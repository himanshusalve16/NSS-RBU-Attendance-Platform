// API Configuration
// For production, set VITE_API_URL environment variable in Vercel
// For local development, defaults to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://your-backend-url.com')

export default API_BASE_URL


const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-in-production';
const AUTH_FILE = path.join(__dirname, 'data', 'auth.json');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize auth file with default password if it doesn't exist
function initializeAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ password: hashedPassword }, null, 2));
    console.log('🔐 Initialized admin password (default: admin123)');
  }
}

// Load hashed password
function getHashedPassword() {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      initializeAuth();
    }
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    return data.password;
  } catch (error) {
    console.error('Error reading auth file:', error);
    initializeAuth();
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    return data.password;
  }
}

// Update password
function updatePassword(newPassword) {
  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ password: hashedPassword }, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

// Simple session tokens (in production, use JWT or proper session management)
const activeTokens = new Set();

// Initialize on module load
initializeAuth();

// Verify admin password
async function verifyPassword(password) {
  const hashedPassword = getHashedPassword();
  return await bcrypt.compare(password, hashedPassword);
}

// Generate session token
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);
  return token;
}

// Verify session token
function verifyToken(token) {
  return activeTokens.has(token);
}

// Remove token (logout)
function removeToken(token) {
  activeTokens.delete(token);
}

// Generate signature for QR code
function generateSignature(sessionId, expiryTime) {
  const data = `${sessionId}|${expiryTime}|${SECRET_KEY}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verify QR code signature
function verifySignature(sessionId, expiryTime, signature) {
  const expectedSignature = generateSignature(sessionId, expiryTime);
  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

module.exports = {
  verifyPassword,
  generateToken,
  verifyToken,
  removeToken,
  generateSignature,
  verifySignature,
  updatePassword,
  getHashedPassword
};

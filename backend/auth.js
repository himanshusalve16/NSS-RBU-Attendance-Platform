const crypto = require('crypto');

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Simple session tokens (in production, use JWT or proper session management)
const activeTokens = new Set();

// Verify admin password (simple string comparison)
function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
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
  verifySignature
};

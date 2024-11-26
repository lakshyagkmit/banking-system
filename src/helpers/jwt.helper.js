const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const process = require('process');

async function generateToken(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  const encryptedToken = encryptJwt(token);

  return encryptedToken;
}

// Encrypt the JWT
function encryptJwt(token) {
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const IV = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${IV.toString('hex')}:${encrypted}`;
}

// Decrypt the JWT
function decryptJwt(encryptedToken) {
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');

  const [iv, encrypted] = encryptedToken.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { generateToken, decryptJwt };

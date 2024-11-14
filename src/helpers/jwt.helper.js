const jwt = require('jsonwebtoken');
const process = require('process');

async function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { generateToken };
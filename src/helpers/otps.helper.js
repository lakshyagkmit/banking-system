const redisClient = require('../config/redis');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOtp(email, otp) {
  const key = `otp:${email}`;
  return redisClient.set(key, otp, 'EX', 60);
}

async function verifyOtp(email, otp) {
  const key = `otp:${email}`;
  const storedOtp = await redisClient.get(key);
  return storedOtp === otp;
}

function deleteOtp(email) {
  const key = `otp:${email}`;
  return redisClient.del(key);
}

module.exports = { generateOtp, saveOtp, verifyOtp, deleteOtp };

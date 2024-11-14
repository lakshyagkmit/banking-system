const redisClient = require('../config/redis');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOtp = (email, otp) => {
  const key = `otp:${email}`;
  return redisClient.set(key, otp, 'EX', 60);
};

module.exports = { generateOtp, saveOtp };

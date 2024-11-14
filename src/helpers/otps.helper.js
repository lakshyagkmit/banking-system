const redisClient = require('../config/redis');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOtp = (email, otp) => {
  const key = `otp:${email}`;
  return redisClient.set(key, otp, 'EX', 60);
};

const verifyOtp = async (email, otp) => {
  const key = `otp:${email}`;
  const storedOtp = await redisClient.get(key);
  return storedOtp === otp;
};

const deleteOtp = email => {
  const key = `otp:${email}`;
  return redisClient.del(key);
};

module.exports = { generateOtp, saveOtp, verifyOtp, deleteOtp };

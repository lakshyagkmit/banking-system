const redis = require('redis');
const process = require('process');
require('dotenv').config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URI,
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => console.log('Redis Connected Successfully'));

redisClient.on('error', err => console.error('Redis error:', err));

module.exports = redisClient;

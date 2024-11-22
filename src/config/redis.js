const redis = require('redis');
const process = require('process');
require('dotenv').config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => console.log('Redis Connected Successfully'));

redisClient.on('error', err => console.error('Redis error:', err));

module.exports = redisClient;

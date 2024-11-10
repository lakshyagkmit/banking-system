require('dotenv').config({ path: __dirname + '/../../.env' });
const process = require('process');

const { DB_USERNAME, DB_PASSWORD, DB_DATABASE, TEST_DATABASE, DB_HOST, DB_PORT, DB_DIALECT } = process.env;

module.exports = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
  },
  test: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: TEST_DATABASE,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
  },
  production: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
  },
};

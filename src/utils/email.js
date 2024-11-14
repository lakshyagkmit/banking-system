const nodemailer = require('nodemailer');
const process = require('process');

const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: process.env.SMPT_PORT,
  auth: {
    user: process.env.SMPT_MAIL,
    pass: process.env.SMPT_APP_PASS,
  },
  authMethod: 'LOGIN',
});

module.exports = transporter;

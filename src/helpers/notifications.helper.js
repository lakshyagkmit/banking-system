const process = require('process');
const transporter = require('../utils/email');
const otpHelper = require('./otps.helper');

async function sendOtp(email) {
  const otp = otpHelper.generateOtp();
  //TO REMOVE
  console.log(otp);

  await otpHelper.saveOtp(email, otp);

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: 'Verification OTP',
    html: `Your OTP code is ${otp}. It will expire in 1 minute.`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtp };

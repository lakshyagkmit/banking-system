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
    html: `<p>Your OTP code is ${otp}. It will expire in 1 minute.</p>
          <p>Federal Bank</p>
        `,
  };
  await transporter.sendMail(mailOptions);
}

async function applicationRequestNotification(email, userName, applicationType) {
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: `New ${applicationType} Request`,
    html: `
      <p>Dear Branch Manager,</p>
      <p>A new <strong>${applicationType}</strong> application has been submitted by <strong>${userName}</strong>.</p>
      <p>Please log in to the system to review the application.</p>
      <p>Thank you.</p>
      <p>Federal Bank</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function applicationSuccessNotification(email, applicationType) {
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: `Your ${applicationType} Application is Submitted`,
    html: `
      <p>Dear User,</p>
      <p>We are pleased to inform you that your <strong>${applicationType}</strong> application has been successfully submitted.</p>
      <p>Our team will review your application and notify you of further updates.</p>
      <p>Thank you for choosing our services.</p>
      <p>Federal Bank</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function accountCreationNotification(email, accountType, accountNumber) {
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: 'Your New Account is Created',
    html: `
      <p>Dear User,</p>
      <p>Congratulations! Your new <strong>${accountType}</strong> account has been successfully created.</p>
      <p>Your account number is <strong>${accountNumber}</strong>.</p>
      <p>Please deposit money within five days to activate it, otherwise it will be deactivated.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function lockerAssignedNotification(email, lockerSerailNo) {
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: 'Locker Request Accepted',
    html: `
      <p>Dear User,</p>
      <p>Congratulations! Your locker request has been accepted.</p>
      <p>Your locker serial no is <storng>${lockerSerailNo}</strong>.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function transactionNotification(email, transactionType, amount, balanceBefore, balanceAfter) {
  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: `Transaction Alert: ${transactionType}`,
    html: `
      <p>Dear User,</p>
      <p>A ${transactionType.toLowerCase()} of <strong>₹${amount}</strong> has been processed in your account.</p>
      <p>Your previous account balance was <strong>₹${balanceBefore}</strong>.</p?
      <p>Your updated account balance is <strong>₹${balanceAfter}</strong>.</p>
      <p>If you did not authorize this transaction, please contact us immediately.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendOtp,
  applicationRequestNotification,
  applicationSuccessNotification,
  accountCreationNotification,
  lockerAssignedNotification,
  transactionNotification,
};

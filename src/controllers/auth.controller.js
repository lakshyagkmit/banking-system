const authService = require('../services/auth.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function register(req, res, next) {
  try {
    const { body, file } = req;
    res.data = await authService.register(body, file);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmail(email, otp);
    res.message = 'Email Verified Successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function login(req, res, next) {
  try {
    const { email } = req.body;
    await authService.login(email);
    res.message = 'OTP Sent on email';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    res.token = await authService.verifyOtp(email, otp);
    res.message = 'OTP Sent on email';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    await authService.resendOtp(email);
    res.message = 'OTP Resent to email';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function logout(req, res, next) {
  res.message = 'User logged out successfully';
  res.statusCode = 204;
  next();
}

module.exports = { register, verifyEmail, login, verifyOtp, resendOtp, logout };

const authService = require('../services/auth.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function register(req, res, next) {
  try {
    const payload = {
      data: req.body,
      file: req.file,
    };
    await authService.register(payload);
    res.message = 'User registered successfully';
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const payload = {
      data: req.body,
    };
    await authService.verifyEmail(payload);
    res.message = 'Email Verified Successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function login(req, res, next) {
  try {
    const payload = {
      data: req.body,
    };
    await authService.login(payload);
    res.message = 'OTP sent on email';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const payload = {
      data: req.body,
    };
    res.token = await authService.verifyOtp(payload);
    res.message = 'OTP sent on email';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function resendOtp(req, res, next) {
  try {
    const payload = {
      data: req.body,
    };
    await authService.resendOtp(payload);
    res.message = 'OTP resent to email';
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

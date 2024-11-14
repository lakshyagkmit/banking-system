const authService = require('../services/auth.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function register(req, res) {
  try {
    const { body, file } = req;
    const newUser = await authService.register(body, file);
    res.status(201).json(newUser);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmail(email, otp);
    res.status(200).json({ message: 'Email Verified Successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const login = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.login(email);
    res.status(200).json({ message: 'OTP Sent on email' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

module.exports = { register, verifyEmail, login };

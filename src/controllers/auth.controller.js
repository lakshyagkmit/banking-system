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

module.exports = { register };

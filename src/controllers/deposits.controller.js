const depositService = require('../services/deposits.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await depositService.create(body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

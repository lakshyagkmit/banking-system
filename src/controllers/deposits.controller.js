const depositService = require('../services/deposits.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    res.data = await depositService.create(payload);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

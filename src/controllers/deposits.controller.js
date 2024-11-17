const depositService = require('../services/deposits.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body, user } = req;
    const deposit = await depositService.create(body, user);
    res.status(201).json(deposit);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

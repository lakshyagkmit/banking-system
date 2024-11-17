const transactionService = require('../services/transactions.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { params, body, user } = req;
    const transaction = await transactionService.create(params, body, user);
    res.status(201).json(transaction);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

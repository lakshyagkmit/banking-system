const transactionService = require('../services/transactions.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { params, body, user } = req;
    const { accountId } = params;
    res.message = await transactionService.create(accountId, body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { params, query, user } = req;
    const { accountId } = params;
    res.data = await transactionService.index(accountId, query, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { params, user } = req;
    const { accountId, transactionId } = params;
    res.data = await transactionService.view(accountId, transactionId, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view };

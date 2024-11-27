const transactionService = require('../services/transactions.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const payload = {
      accountId: req.params.accountId,
      data: req.body,
      user: req.user,
    };
    res.message = await transactionService.create(payload);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const payload = {
      accountId: req.params.accountId,
      query: req.query,
      user: req.user,
    };
    res.data = await transactionService.index(payload);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const payload = {
      accountId: req.params.accountId,
      transactionId: req.params.transactionId,
      user: req.user,
    };
    res.data = await transactionService.view(payload);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function update(req, res, next) {
  try {
    const payload = {
      accountId: req.params.accountId,
      transactionId: req.params.transactionId,
      user: req.user,
    };
    res.message = await transactionService.update(payload);
    res.statusCode = 202;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update };

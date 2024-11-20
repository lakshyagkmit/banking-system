const accountService = require('../services/accounts.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await accountService.create(body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query, user } = req;
    res.data = await accountService.index(query, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { params, user } = req;
    const { id } = params;
    const account = await accountService.view(id, user);
    if (!account) {
      res.message = 'User not found';
      res.statusCode = 404;
      return next();
    }
    res.data = account;
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function update(req, res, next) {
  try {
    const { params, body, user } = req;
    const { id } = params;
    res.message = 'Account updated successfully';
    res.data = await accountService.update(id, body, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function remove(req, res, next) {
  try {
    const { params, user } = req;
    const { id } = params;
    await accountService.remove(id, user);
    res.message = 'Account deleted successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update, remove };

const accountService = require('../services/accounts.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    res.data = await accountService.create(payload);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const payload = {
      query: req.query,
      user: req.user,
    };
    res.data = await accountService.index(payload);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const payload = {
      id: req.params.id,
      user: req.user,
    };
    res.data = await accountService.view(payload);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function update(req, res, next) {
  try {
    const payload = {
      id: req.params.id,
      data: req.body,
      user: req.user,
    };
    res.data = await accountService.update(payload);
    res.message = 'Account updated successfully';
    res.statusCode = 202;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function remove(req, res, next) {
  try {
    const payload = {
      id: req.params.id,
      user: req.user,
    };
    await accountService.remove(payload);
    res.message = 'Account deleted successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update, remove };

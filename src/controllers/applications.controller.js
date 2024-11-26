const applicationService = require('../services/applications.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function requestAccount(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    res.data = await applicationService.requestAccount(payload);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function requestLocker(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    res.data = await applicationService.requestLocker(payload);
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
    res.data = await applicationService.index(payload);
    res.statusCode = 201;
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
    res.data = await applicationService.view(payload);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { requestAccount, requestLocker, index, view };

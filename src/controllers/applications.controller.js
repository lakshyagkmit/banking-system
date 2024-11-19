const applicationService = require('../services/applications.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function requestAccount(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await applicationService.requestAccount(body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function requestLocker(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await applicationService.requestLocker(body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query, user } = req;
    res.data = await applicationService.index(query, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { params, user } = req;
    const { id } = params;
    const application = await applicationService.view(id, user);
    if (!application) {
      res.message = 'Application not found';
      res.statusCode = 404;
      next();
    }
    res.status(200).json(application);
    res.data = application;
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { requestAccount, requestLocker, index, view };

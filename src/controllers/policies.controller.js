const policyService = require('../services/policies.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { body } = req;
    res.data = await policyService.create(body);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query } = req;
    res.data = await policyService.index(query);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { id } = req.params;
    const policy = await policyService.view(id);
    if (!policy) {
      res.message = 'policy not found';
      res.statusCode = 404;
      next();
    }
    res.data = policy;
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function update(req, res, next) {
  try {
    const { params, body } = req;
    const { id } = params;
    res.data = await policyService.update(id, body);
    res.message = 'policy updated successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await policyService.remove(id);
    res.message = 'policy deleted successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update, remove };

const branchService = require('../services/branches.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { body } = req;
    res.data = await branchService.create(body);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query } = req;
    res.data = await branchService.index(query);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { id } = req.params;
    const branch = await branchService.view(id);
    if (!branch) {
      res.message = 'Branch not found';
      res.statusCode = 404;
      next();
    }
    res.data = branch;
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
    res.data = await branchService.update(id, body);
    res.message = 'Branch updated successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update };

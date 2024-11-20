const lockerService = require('../services/lockers.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function assign(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await lockerService.assign(body, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function create(req, res, next) {
  try {
    const { body, user } = req;
    res.data = await lockerService.create(body, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query, user } = req;
    res.data = await lockerService.index(query, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function view(req, res, next) {
  try {
    const { user, params } = req;
    const { id } = params;
    res.data = await lockerService.view(id, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function update(req, res, next) {
  try {
    const { body, user, params } = req;
    const { id } = params;
    res.data = await lockerService.update(id, body, user);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deallocate(req, res, next) {
  try {
    const { params, user } = req;
    const { id } = params;
    await lockerService.deallocate(id, user);
    res.message = 'Locker Deallocated successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { assign, create, index, view, update, deallocate };

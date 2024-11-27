const lockerService = require('../services/lockers.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function assign(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    await lockerService.assign(payload);
    res.message = 'Locker assigned successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function create(req, res, next) {
  try {
    const payload = {
      data: req.body,
      user: req.user,
    };
    await lockerService.create(payload);
    res.message = 'Lockers added successfully';
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
    res.data = await lockerService.index(payload);
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
    res.data = await lockerService.view(payload);
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
    await lockerService.update(payload);
    res.message = 'Locker updated successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deallocate(req, res, next) {
  try {
    const payload = {
      id: req.params.id,
      user: req.user,
    };
    await lockerService.deallocate(payload);
    res.message = 'Locker Deallocated successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { assign, create, index, view, update, deallocate };

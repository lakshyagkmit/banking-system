const userService = require('../services/users.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const { body, file, user } = req;
    res.data = await userService.create(body, file, user);
    res.statusCode = 201;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function index(req, res, next) {
  try {
    const { query, user } = req;
    res.data = await userService.index(query, user);
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
    const userData = await userService.view(id, user);
    if (!userData) {
      res.message = 'User not found';
      res.statusCode = 404;
      next();
    }
    res.data = userData;
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
    res.data = await userService.update(id, body, user);
    res.message = 'User updated successfully';
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
    await userService.remove(id, user);
    res.message = 'user deleted successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, view, update, remove };

const userService = require('../services/users.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res, next) {
  try {
    const payload = {
      data: req.body,
      file: req.file,
      user: req.user,
    };
    await userService.create(payload);
    res.message = 'User created successfully';
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
    res.data = await userService.index(payload);
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
    res.data = await userService.view(payload);
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function viewMe(req, res, next) {
  try {
    const { user } = req;
    const { id } = user;
    res.data = await userService.viewMe(id);
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
    res.data = await userService.update(payload);
    res.message = 'User updated successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function remove(req, res, next) {
  try {
    const { params } = req;
    const { id } = params;
    await userService.remove(id);
    res.message = 'User deleted successfully';
    res.statusCode = 204;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function updateRoles(req, res, next) {
  try {
    const payload = {
      id: req.params.id,
      data: req.body,
    };
    res.data = await userService.updateRoles(payload);
    res.message = 'User roles updated successfully';
    res.statusCode = 200;
    next();
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, index, viewMe, view, update, remove, updateRoles };

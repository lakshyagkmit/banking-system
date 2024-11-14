const userService = require('../services/users.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body, file, user } = req;
    const newUser = await userService.create(body, file, user);
    res.status(201).json(newUser);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function get(req, res) {
  try {
    const { query, user } = req;
    const usersData = await userService.list(query, user);
    res.status(200).json(usersData);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, get };

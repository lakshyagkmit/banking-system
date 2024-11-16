const lockerService = require('../services/lockers.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function assign(req, res) {
  try {
    const { body, user } = req;
    const result = await lockerService.assign(body, user);
    res.status(200).json(result);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function create(req, res) {
  try {
    const { body, user } = req;
    const result = await lockerService.create(body, user);
    res.status(201).json(result);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { assign, create };

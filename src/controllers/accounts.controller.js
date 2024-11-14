const accountService = require('../services/accounts.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body, user } = req;
    const newAccount = await accountService.create(body, user);
    res.status(201).json(newAccount);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

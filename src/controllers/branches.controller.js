const branchService = require('../services/branches.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body } = req;
    const newBranch = await branchService.create(body);
    res.status(201).json(newBranch);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

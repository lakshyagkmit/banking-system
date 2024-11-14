const policyService = require('../services/policies.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body } = req;
    const newPolicy = await policyService.create(body);
    res.status(201).json(newPolicy);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create };

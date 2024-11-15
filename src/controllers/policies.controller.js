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

async function get(req, res) {
  try {
    const { query } = req;
    const policies = await policyService.list(query);
    res.status(200).json(policies);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const policy = await policyService.listById(id);
    if (!policy) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.status(200).json(policy);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function updateById(req, res) {
  try {
    const { params, body } = req;
    const policy = await policyService.updateById(params.id, body);
    res.status(200).json({ policy, message: 'User updated successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deleteById(req, res) {
  try {
    const { id } = req.params;
    await policyService.deleteById(id);
    res.status(204).send({ message: 'policy deleted successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, get, getById, updateById, deleteById };

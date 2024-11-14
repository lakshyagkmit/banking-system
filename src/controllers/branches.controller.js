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

async function get(req, res) {
  try {
    const { query } = req;
    const branches = await branchService.list(query);
    res.status(200).json(branches);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const branch = await branchService.listById(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.status(200).json(branch);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function updateById(req, res) {
  try {
    const { params, body } = req;
    const branch = await branchService.updateById(params.id, body);
    res.status(200).json({ branch, message: 'User updated successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deleteById(req, res) {
  try {
    const { id } = req.params;
    await branchService.deleteById(id);
    res.status(204).send({ message: 'Branch deleted successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(
      req,
      res,
      error.message,
      error.statusCode,
      error
    );
  }
}


module.exports = { create, get, getById, updateById, deleteById };

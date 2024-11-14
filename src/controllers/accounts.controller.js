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

async function get(req, res) {
  try {
    const { query, user } = req;
    const accounts = await accountService.list(query, user);
    res.status(200).json(accounts);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { params, user } = req;
    const account = await accountService.listById(params, user);
    if (!account) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(account);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, get, getById };

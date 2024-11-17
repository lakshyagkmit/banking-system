const applicationService = require('../services/applications.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function requestAccount(req, res) {
  try {
    const { body, user } = req;
    const application = await applicationService.requestAccount(body, user);
    res.status(201).json(application);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function requestLocker(req, res) {
  try {
    const { body, user } = req;
    const application = await applicationService.requestLocker(body, user);
    res.status(201).json(application);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function get(req, res) {
  try {
    const { query, user } = req;
    const applications = await applicationService.list(query, user);
    res.status(200).json(applications);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { params, user } = req;
    const application = await applicationService.listById(params, user);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { requestAccount, requestLocker, get, getById };

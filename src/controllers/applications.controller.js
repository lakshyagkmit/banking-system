const applicationService = require('../services/applications.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function requestAccount(req, res) {
  try {
    const { body, user } = req;
    const newApplication = await applicationService.requestAccount(body, user);
    res.status(201).json(newApplication);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function requestLocker(req, res) {
  try {
    const { body, user } = req;
    const newApplication = await applicationService.requestLocker(body, user);
    res.status(201).json(newApplication);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function get(req, res) {
  try {
    const { query } = req;
    const applications = await applicationService.list(query);
    res.status(200).json(applications);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { params } = req;
    const application = await applicationService.listById(params);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { requestAccount, requestLocker, get, getById };

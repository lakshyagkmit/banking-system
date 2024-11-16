const lockerService = require('../services/lockers.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function assign(req, res) {
  try {
    const { body, user } = req;
    const locker = await lockerService.assign(body, user);
    res.status(200).json(locker);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function create(req, res) {
  try {
    const { body, user } = req;
    const locker = await lockerService.create(body, user);
    res.status(201).json(locker);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function get(req, res) {
  try {
    const { query, user } = req;
    const lockers = await lockerService.list(query, user);
    res.status(200).json(lockers);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;
    const locker = await lockerService.listById(id, user);
    res.status(200).json(locker);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function updateById(req, res) {
  try {
    const { id } = req.params;
    const { body, user } = req;
    const locker = await lockerService.updateById(id, body, user);
    res.status(200).json(locker);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deleteById(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;
    await lockerService.deleteById(id, user);
    res.status(200).json({ message: 'Locker Deallocated successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { assign, create, get, getById, updateById, deleteById };

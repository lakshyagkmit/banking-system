const userService = require('../services/users.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { body, file, user } = req;
    const newUser = await userService.create(body, file, user);
    res.status(201).json(newUser);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function get(req, res) {
  try {
    const { query, user } = req;
    const usersData = await userService.list(query, user);
    res.status(200).json(usersData);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function getById(req, res) {
  try {
    const { params, user } = req;
    const userData = await userService.listById(params, user);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(userData);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function updateById(req, res) {
  try {
    const { params, body, user } = req;
    const userData = await userService.updateById(params, body, user);
    res.status(200).json({ userData, message: 'User updated successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

async function deleteById(req, res) {
  try {
    const { params, user } = req;
    await userService.deleteById(params.id, user);
    res.status(204).send({ message: 'user deleted successfully' });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

module.exports = { create, get, getById, updateById, deleteById };

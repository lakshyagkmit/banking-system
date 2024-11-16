const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const lockerValidator = require('../validators/lockers.validator');
const lockerController = require('../controllers/lockers.controller');
const constants = require('../constants/constants');

// Protected Routes
router.post(
  '/assign',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  lockerValidator.lockerAssignSchema,
  lockerController.assign
);

router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  lockerValidator.createLockerSchema,
  lockerController.create
);

module.exports = router;

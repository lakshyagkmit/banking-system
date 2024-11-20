const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const depositValidator = require('../validators/deposits.validator');
const depositController = require('../controllers/deposits.controller');
const accountSerializer = require('../serializers/accounts.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['103']),
  depositValidator.createSchema,
  depositController.create,
  accountSerializer.serialize,
  commonHelper.sendResponse
);

module.exports = router;

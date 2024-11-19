const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const applicationValidator = require('../validators/applications.validator');
const applicationController = require('../controllers/applications.controller');
const applicationSerialize = require('../serializers/applications.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const commonValidator = require('../validators/commons.validator');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/accounts',
  authMiddleware.checkAuthToken,
  applicationValidator.accountSchema,
  applicationController.requestAccount,
  applicationSerialize.serialize,
  commonHelper.sendResponse
);

router.post(
  '/lockers',
  authMiddleware.checkAuthToken,
  applicationValidator.lockerSchema,
  applicationController.requestLocker,
  applicationSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.querySchema,
  applicationController.inde,
  applicationSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  applicationController.view,
  applicationSerialize.serialize,
  commonHelper.sendResponse
);

module.exports = router;

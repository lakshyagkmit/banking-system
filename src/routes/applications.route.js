const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const applicationValidator = require('../validators/applications.validator');
const applicationController = require('../controllers/applications.controller');
const applicationSerializer = require('../serializers/applications.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const commonValidator = require('../validators/commons.validator');
const { ROLES } = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/accounts',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['103']),
  applicationValidator.accountSchema,
  applicationController.requestAccount,
  applicationSerializer.serialize,
  commonHelper.sendResponse
);

router.post(
  '/lockers',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['103']),
  applicationValidator.lockerSchema,
  applicationController.requestLocker,
  applicationSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['102']),
  commonValidator.querySchema,
  applicationController.index,
  applicationSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['102']),
  commonValidator.idSchema,
  applicationController.view,
  applicationSerializer.serialize,
  commonHelper.sendResponse
);

module.exports = router;

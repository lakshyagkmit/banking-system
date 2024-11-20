const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const lockerValidator = require('../validators/lockers.validator');
const commonValidator = require('../validators/commons.validator');
const lockerController = require('../controllers/lockers.controller');
const lockerSerializer = require('../serializers/lockers.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

// Protected Routes
router.post(
  '/assign',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  lockerValidator.lockerAssignSchema,
  lockerController.assign,
  commonHelper.sendResponse
);

router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  lockerValidator.createLockerSchema,
  lockerController.create,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['102'], constants.ROLES['103']]),
  commonValidator.querySchema,
  lockerController.index,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['102'], constants.ROLES['103']]),
  commonValidator.idSchema,
  lockerController.view,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  lockerValidator.updateLockerSchema,
  lockerController.update,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  lockerController.deallocate,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

module.exports = router;

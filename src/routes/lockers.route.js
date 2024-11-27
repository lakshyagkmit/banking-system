const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const lockerValidator = require('../validators/lockers.validator');
const commonValidator = require('../validators/commons.validator');
const lockerController = require('../controllers/lockers.controller');
const lockerSerializer = require('../serializers/lockers.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const { ROLES } = require('../constants/constants');

// Protected Routes
router.post(
  '/assign',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['102']),
  lockerValidator.assignSchema,
  lockerController.assign,
  commonHelper.sendResponse
);

router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['101'], ROLES['102']]),
  lockerValidator.createSchema,
  lockerController.create,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  commonValidator.querySchema,
  lockerController.index,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  commonValidator.idSchema,
  lockerController.view,
  lockerSerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['101'], ROLES['102']]),
  commonValidator.idSchema,
  lockerValidator.updateSchema,
  lockerController.update,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['101'], ROLES['102']]),
  commonValidator.idSchema,
  lockerController.deallocate,
  commonHelper.sendResponse
);

module.exports = router;

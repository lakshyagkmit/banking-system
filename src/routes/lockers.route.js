const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const lockerValidator = require('../validators/lockers.validator');
const commonValidator = require('../validators/commons.validator');
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

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['102'], constants.ROLES['103']]),
  commonValidator.querySchema,
  lockerController.get
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  lockerController.getById
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  lockerValidator.updateLockerSchema,
  lockerController.updateById
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  lockerController.deleteById
);

module.exports = router;

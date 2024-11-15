const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const applicationValidator = require('../validators/applications.validator');
const applicationController = require('../controllers/applications.controller');
const commonValidator = require('../validators/commons.validator');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/accounts',
  authMiddleware.checkAuthToken,
  applicationValidator.accountsApplicationSchema,
  applicationController.requestAccount
);

router.post(
  '/lockers',
  authMiddleware.checkAuthToken,
  applicationValidator.lockersApplicationSchema,
  applicationController.requestLocker
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.querySchema,
  applicationController.get
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  applicationController.getById
);

module.exports = router;

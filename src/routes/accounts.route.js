const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const commonValidator = require('../validators/commons.validator');
const accountValidator = require('../validators/accounts.validator');
const accountController = require('../controllers/accounts.controller');
const accountSerializer = require('../serializers/accounts.serializer');
const transactionValidator = require('../validators/transactions.validator');
const transactionController = require('../controllers/transactions.controller');
const transactionSerializer = require('../serializers/transactions.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const { ROLES } = require('../constants/constants');

const router = express.Router();

// Protected Routes
// Accounts routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['102']),
  accountValidator.createSchema,
  accountController.create,
  accountSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  commonValidator.querySchema,
  accountController.index,
  accountSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  commonValidator.idSchema,
  accountController.view,
  accountSerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['101'], ROLES['102']]),
  commonValidator.idSchema,
  accountValidator.updateSchema,
  accountController.update,
  accountSerializer.serialize,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['101'], ROLES['102']]),
  commonValidator.idSchema,
  accountController.remove,
  commonHelper.sendResponse
);

// Transactions Routes
router.post(
  '/:accountId/transactions',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['103']),
  transactionValidator.createTransaction,
  transactionController.create,
  commonHelper.sendResponse
);

router.get(
  '/:accountId/transactions',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['102'], ROLES['103']]),
  commonValidator.querySchema,
  transactionController.index,
  transactionSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:accountId/transactions/:transactionId',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([ROLES['102'], ROLES['103']]),
  transactionController.view,
  transactionSerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:accountId/transactions/:transactionId',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['102']),
  transactionController.update,
  commonHelper.sendResponse
);

module.exports = router;

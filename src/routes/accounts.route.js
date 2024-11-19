const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const commonValidator = require('../validators/commons.validator');
const accountValidator = require('../validators/accounts.validator');
const accountController = require('../controllers/accounts.controller');
const accountSerialize = require('../serializers/accounts.serializer');
const transactionValidator = require('../validators/transactions.validator');
const transactionController = require('../controllers/transactions.controller');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
// Accounts routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  accountValidator.createSchema,
  accountController.create,
  accountSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  commonValidator.querySchema,
  accountController.index,
  accountSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  commonValidator.idSchema,
  accountController.view,
  accountSerialize.serialize,
  commonHelper.sendResponse
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  accountValidator.updateSchema,
  accountController.update,
  accountSerialize.serialize,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  accountController.remove,
  accountSerialize.serialize,
  commonHelper.sendResponse
);

// Transactions Routes
router.post(
  '/:accountId/transactions',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['103']),
  transactionValidator.transactionSchema,
  transactionController.create
);

router.post(
  '/:accountId/transactions',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['102'], constants.ROLES['103']]),
  commonValidator.querySchema,
  transactionController.get
);

router.post(
  '/:accountId/transactions/:transactionId',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['102'], constants.ROLES['103']]),
  commonValidator.idSchema,
  transactionController.getById
);

module.exports = router;

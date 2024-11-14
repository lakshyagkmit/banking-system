const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const commonValidator = require('../validators/commons.validator');
const accountValidator = require('../validators/accounts.validator');
const accountController = require('../controllers/accounts.controller');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
// Accounts routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  accountValidator.accountsCreateSchema,
  accountController.create
);

router.get('/', authMiddleware.checkAuthToken, commonValidator.limitPageSchema, accountController.get);

router.get('/:id', authMiddleware.checkAuthToken, commonValidator.idSchema, accountController.getById);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  accountValidator.accountsUpdateSchema,
  accountController.updateById
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['102']),
  commonValidator.idSchema,
  accountController.deleteById
);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const depositValidator = require('../validators/accounts.validator');
const depositController = require('../controllers/accounts.controller');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
// Accounts routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['103']),
  depositValidator.depositsCreateSchema,
  depositController.create
);

module.exports = router;

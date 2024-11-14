const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const policyValidator = require('../validators/policies.validator');
const policyController = require('../controllers/policies.controller');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  policyValidator.createPolicySchema,
  policyController.create
);

module.exports = router;

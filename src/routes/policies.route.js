const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const commonValidator = require('../validators/commons.validator');
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

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.limitPageSchema,
  policyController.get
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  policyController.getById
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  policyValidator.updatePolicySchema,
  policyController.updateById
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  policyController.deleteById
);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const commonValidator = require('../validators/commons.validator');
const policyValidator = require('../validators/policies.validator');
const policyController = require('../controllers/policies.controller');
const policySerializer = require('../serializers/policies.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const { ROLES } = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  policyValidator.createSchema,
  policyController.create,
  policySerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.querySchema,
  policyController.index,
  policySerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.idSchema,
  policyController.view,
  policySerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.idSchema,
  policyValidator.updateSchema,
  policyController.update,
  policySerializer.serialize,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.idSchema,
  policyController.remove,
  commonHelper.sendResponse
);

module.exports = router;

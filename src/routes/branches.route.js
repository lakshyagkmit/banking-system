const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const branchValidator = require('../validators/branches.validator');
const commonValidator = require('../validators/commons.validator');
const branchController = require('../controllers/branches.controller');
const branchSerializer = require('../serializers/branches.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const { ROLES } = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  branchValidator.createSchema,
  branchController.create,
  branchSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.querySchema,
  branchController.index,
  branchSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.idSchema,
  branchController.view,
  branchSerializer.serialize,
  commonHelper.sendResponse
);

router.patch(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(ROLES['101']),
  commonValidator.idSchema,
  branchValidator.updateSchema,
  branchController.update,
  branchSerializer.serialize,
  commonHelper.sendResponse
);

module.exports = router;

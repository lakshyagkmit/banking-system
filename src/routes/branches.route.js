const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const branchValidator = require('../validators/branches.validator');
const commonValidator = require('../validators/commons.validator');
const branchController = require('../controllers/branches.controller');
const branchSerialize = require('../serializers/branches.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  branchValidator.createSchema,
  branchController.create,
  branchSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.querySchema,
  branchController.index,
  branchSerialize.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  branchController.view,
  branchSerialize.serialize,
  commonHelper.sendResponse
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  branchValidator.updateSchema,
  branchController.update,
  branchSerialize.serialize,
  commonHelper.sendResponse
);

module.exports = router;

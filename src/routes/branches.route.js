const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const branchValidator = require('../validators/branches.validator');
const commonValidator = require('../validators/commons.validator');
const branchController = require('../controllers/branches.controller');
const constants = require('../constants/constants');

const router = express.Router();

// Protected Routes
router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  branchValidator.createBranchSchema,
  branchController.create
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.limitPageSchema,
  branchController.get
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  branchController.getById
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  commonValidator.idSchema,
  branchValidator.updateBranchSchema,
  branchController.updateById
);

module.exports = router;

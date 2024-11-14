const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const branchValidator = require('../validators/branches.validator');
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

module.exports = router;

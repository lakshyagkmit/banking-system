const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const applicationValidator = require('../validators/applications.validator');
const applicationController = require('../controllers/applications.controller');

const router = express.Router();

// Protected Routes
router.post(
  '/accounts',
  authMiddleware.checkAuthToken,
  applicationValidator.accountsApplicationSchema,
  applicationController.requestAccount
);

router.post(
  '/lockers',
  authMiddleware.checkAuthToken,
  applicationValidator.lockersApplicationSchema,
  applicationController.requestLocker
);

module.exports = router;

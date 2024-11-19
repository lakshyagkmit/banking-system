const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const multerMiddleware = require('../middlewares/multer.middleware');
const authValidator = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');
const userSerialize = require('../serializers/users.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');

const router = express.Router();

//Public routes
router.post(
  '/register',
  multerMiddleware.upload.single('govIssueIdImage'),
  authValidator.registerSchema,
  authController.register,
  userSerialize.serialize,
  commonHelper.sendResponse
);
router.post('/verify-email', authValidator.otpSchema, authController.verifyEmail, commonHelper.sendResponse);

router.post('/otp-login', authValidator.loginSchema, authController.login, commonHelper.sendResponse);

router.post('/otp-verify', authValidator.otpSchema, authController.verifyOtp, commonHelper.sendResponse);

router.post('/otp-resend', authController.resendOtp, commonHelper.sendResponse);

// Protected route
router.delete('/logout', authMiddleware.checkAuthToken, authController.logout, commonHelper.sendResponse);

module.exports = router;

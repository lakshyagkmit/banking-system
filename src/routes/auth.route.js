const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const multerMiddleware = require('../middlewares/multer.middleware');
const authValidator = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

//Public routes
router.post(
  '/register',
  multerMiddleware.upload.single('govIssueIdImage'),
  authValidator.registerSchema,
  authController.register
);
router.post('/verify-email', authValidator.otpSchema, authController.verifyEmail);

router.post('/otp-login', authValidator.loginSchema, authController.login);
router.post('/otp-verify', authValidator.otpSchema, authController.verifyOtp);

router.post('/otp-resend', authController.resendOtp);

// Protected route
router.delete('/logout', authMiddleware.checkAuthToken, authController.logout);

module.exports = router;

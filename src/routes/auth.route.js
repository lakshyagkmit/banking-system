const express = require('express');
const multerMiddleware = require('../middlewares/multer.middleware');
const fileValidator = require('../validators/files.validator');
const authValidator = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

//Public routes
router.post(
  '/register',
  multerMiddleware.upload.single('govIssueIdImage'),
  fileValidator.validateFile,
  authValidator.registerSchema,
  authController.register
);

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const multerMiddleware = require('../middlewares/multer.middleware');
const fileValidator = require('../validators/files.validator');
const userValidator = require('../validators/users.validator');
const commonValidator = require('../validators/commons.validator');
const userController = require('../controllers/users.controller');
const constants = require('../constants/constants');

router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole(constants.ROLES['101']),
  fileValidator.validateFile,
  multerMiddleware.upload.single('govIssueIdImage'),
  userValidator.createUserSchema,
  userController.create
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.limitPageSchema,
  userController.get
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.idSchema,
  userController.getById
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  commonValidator.idSchema,
  userValidator.updateUserSchema,
  userController.updateById
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.idSchema,
  userController.deleteById
);

module.exports = router;

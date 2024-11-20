const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const multerMiddleware = require('../middlewares/multer.middleware');
const userValidator = require('../validators/users.validator');
const commonValidator = require('../validators/commons.validator');
const userController = require('../controllers/users.controller');
const userSerializer = require('../serializers/users.serializer');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

router.post(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  multerMiddleware.upload.single('govIssueIdImage'),
  userValidator.createUserSchema,
  userController.create,
  userSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.querySchema,
  userController.index,
  userSerializer.serialize,
  commonHelper.sendResponse
);

router.get(
  '/:id',
  authMiddleware.checkAuthToken,
  commonValidator.idSchema,
  userController.view,
  userSerializer.serialize,
  commonHelper.sendResponse
);

router.put(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.idSchema,
  userValidator.updateUserSchema,
  userController.update,
  userSerializer.serialize,
  commonHelper.sendResponse
);

router.delete(
  '/:id',
  authMiddleware.checkAuthToken,
  authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]),
  commonValidator.idSchema,
  userController.remove,
  userSerializer.serialize,
  commonHelper.sendResponse
);

module.exports = router;

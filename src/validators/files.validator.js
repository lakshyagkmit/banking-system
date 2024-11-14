const Joi = require('joi');
const commonHelper = require('../helpers/commonFunctions.helper');

const fileValidationSchema = Joi.object({
  mimetype: Joi.string()
    .valid('image/png', 'image/jpg', 'image/jpeg')
    .required()
    .error(new Error('Only PNG, JPG, and JPEG files are allowed')),
  size: Joi.number()
    .max(5 * 1024 * 1024)
    .error(new Error('File size must be less than 5 MB')),
}).unknown(true);

const validateFile = (req, res, next) => {
  const { file } = req;
  console.log(file);
  const { error } = fileValidationSchema.validate(file);
  if (error) {
    commonHelper.customError(error.message, 422);
  }
  next();
};

module.exports = { validateFile };

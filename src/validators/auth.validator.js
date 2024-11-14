const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

// register validator
async function registerSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    govIssueIdType: Joi.string().valid(...Object.values(constants.GOV_ISSUE_ID_TYPES)),
    fatherName: Joi.string().max(50),
    motherName: Joi.string().max(50),
    address: Joi.string(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// otp validator
async function otpSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// login validator
async function loginSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { registerSchema, otpSchema, loginSchema };

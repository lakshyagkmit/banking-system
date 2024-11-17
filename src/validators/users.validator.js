const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

// user creation validator
async function createUserSchema(req, res, next) {
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
    emailVerified: Joi.boolean().default(false),
    isVerified: Joi.boolean().default(false),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

const updateUserSchema = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().max(50).optional(),
    email: Joi.string().email().optional(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .optional(),
    fatherName: Joi.string().max(50).optional(),
    motherName: Joi.string().max(50).optional(),
    address: Joi.string().optional(),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
};

module.exports = { createUserSchema, updateUserSchema };

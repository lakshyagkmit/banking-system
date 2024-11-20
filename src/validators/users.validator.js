const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

// user creation validator
async function createSchema(req, res, next) {
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
    isVerified: Joi.boolean().default(false),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

const updateSchema = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    fatherName: Joi.string().max(50).required(),
    motherName: Joi.string().max(50).required(),
    address: Joi.string().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
};

module.exports = { createSchema, updateSchema };

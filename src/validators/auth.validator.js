const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

const registerSchema = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    govIssueIdType: Joi.string().valid('passport', 'adhar', 'pan', 'voter_id', "driver's license"),
    fatherName: Joi.string().max(50),
    motherName: Joi.string().max(50),
    address: Joi.string(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
};

module.exports = { registerSchema };

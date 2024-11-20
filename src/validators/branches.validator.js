const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

// create branch validator
async function branchSchema(req, res, next) {
  const schema = Joi.object({
    userId: Joi.string()
      .trim()
      .guid({ version: ['uuidv4'] })
      .required(),
    address: Joi.string(),
    ifscCode: Joi.string().max(20).required(),
    contact: Joi.string().required(),
    totalLockers: Joi.number().integer(),
  });
  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { branchSchema };

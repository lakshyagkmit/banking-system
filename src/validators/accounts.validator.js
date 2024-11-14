const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

//create account validator
async function accountsSchema(req, res, next) {
  const schema = Joi.object({
    userId: Joi.string().guid({ version: 'uuidv4' }).required(),
    type: Joi.string().valid('savings', 'current').required(),
    subtype: Joi.string().max(50).optional(),
    balance: Joi.number().precision(2).required(),
    interestRate: Joi.number().precision(2).required(),
    nominee: Joi.string().max(50).required(),
    branchIfscCode: Joi.string().max(20).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { accountsSchema };
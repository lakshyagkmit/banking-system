const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//create account validator
async function accountsCreateSchema(req, res, next) {
  const schema = Joi.object({
    userId: Joi.string().guid({ version: 'uuidv4' }).required(),
    type: Joi.string().valid(constants.ACCOUNT_TYPES.SAVINGS, constants.ACCOUNT_TYPES.CURRENT).required(),
    subtype: Joi.string().max(50).optional(),
    balance: Joi.number().precision(2).required(),
    interestRate: Joi.number().precision(2).required(),
    nominee: Joi.string().max(50).required(),
    branchIfscCode: Joi.string().max(20).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// account update schema
async function accountsUpdateSchema(req, res, next) {
  const schema = Joi.object({
    nominee: Joi.string().max(50).optional(),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { accountsCreateSchema, accountsUpdateSchema };

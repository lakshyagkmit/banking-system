const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

// create policy validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    accountType: Joi.string()
      .valid(...Object.values(constants.ACCOUNT_TYPES))
      .required()
      .label('Account Type'),
    initialAmount: Joi.number().precision(2).min(0).required().label('Initial Amount'),
    interestRate: Joi.number().precision(2).min(0).max(10).required().label('Interest Rate'),
    minimumAmount: Joi.number().precision(2).min(0).required().label('Minimum Amount'),
    lockInPeriod: Joi.number().integer().min(0).optional().label('Lock-in Period'),
    penaltyFee: Joi.number().precision(2).min(0).label('Penalty Fee'),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// update policy validator
async function updateSchema(req, res, next) {
  const schema = Joi.object({
    accountType: Joi.string()
      .valid(...Object.values(constants.ACCOUNT_TYPES))
      .optional()
      .label('Account Type'),
    initialAmount: Joi.number().precision(2).min(0).optional().label('Initial Amount'),
    interestRate: Joi.number().precision(2).min(0).max(10).optional().label('Interest Rate'),
    minimumAmount: Joi.number().precision(2).min(0).optional().label('Minimum Amount'),
    lockInPeriod: Joi.number().integer().min(0).optional().label('Lock-in Period'),
    penaltyFee: Joi.number().precision(2).min(0).optional().label('Penalty Fee'),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createSchema, updateSchema };

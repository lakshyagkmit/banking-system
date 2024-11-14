const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

// create policy validator
async function createPolicySchema(req, res, next) {
  const schema = Joi.object({
    accountType: Joi.string()
      .valid('savings', 'current', 'fixed', 'recurring')
      .required()
      .label('Account Type'),
    accountSubtype: Joi.string().max(50).required().label('Account Subtype'),
    interestRate: Joi.number().precision(2).min(0).max(10).required().label('Interest Rate'),
    minimumAmount: Joi.number().precision(2).min(0).required().label('Minimum Amount'),
    lockInPeriod: Joi.number().integer().min(0).optional().label('Lock-in Period'),
    penaltyFee: Joi.number().precision(2).min(0).label('Penalty Fee'),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// update policy validator
async function updatePolicySchema(req, res, next) {
  const schema = Joi.object({
    accountType: Joi.string()
      .valid('savings', 'current', 'fixed', 'recurring')
      .optional()
      .label('Account Type'),
    accountSubtype: Joi.string().max(50).optional().label('Account Subtype'),
    interestRate: Joi.number().precision(2).min(0).max(10).optional().label('Interest Rate'),
    minimumAmount: Joi.number().precision(2).min(0).optional().label('Minimum Amount'),
    lockInPeriod: Joi.number().integer().min(0).optional().label('Lock-in Period'),
    penaltyFee: Joi.number().precision(2).min(0).optional().label('Penalty Fee'),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createPolicySchema, updatePolicySchema };

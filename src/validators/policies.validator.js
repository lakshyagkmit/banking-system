const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

const createPolicySchema = async (req, res, next) => {
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
};

module.exports = { createPolicySchema };

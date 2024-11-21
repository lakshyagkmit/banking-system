const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const { TRANSACTION_TYPES, PAYMENT_METHODS } = require('../constants/constants');

//create transaction validator
async function createTransaction(req, res, next) {
  const schema = Joi.object({
    accountNo: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(TRANSACTION_TYPES))
      .required(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PAYMENT_METHODS))
      .required(),
    amount: Joi.number().precision(2).required(),
    fee: Joi.number().precision(2).default(0),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createTransaction };

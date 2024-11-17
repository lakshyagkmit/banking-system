const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('..contants/constants');

//create transaction validator
async function transactionSchema(req, res, next) {
  const schema = Joi.object({
    toAccountNo: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(constants.TRANSACTION_TYPES))
      .required(),
    paymentMethod: Joi.string()
      .valid(...Object.values(constants.PAYMENT_METHODS))
      .required(),
    amount: Joi.number().precision(2).required(),
    fee: Joi.number().precision(2).default(0),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { transactionSchema };

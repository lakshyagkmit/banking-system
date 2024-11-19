const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//create transaction validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    accountNo: Joi.string().optional(),
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

module.exports = { createSchema };

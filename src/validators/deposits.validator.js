const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const { ACCOUNT_TYPES } = require('../constants/constants');

//create account validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid(ACCOUNT_TYPES.FIXED, ACCOUNT_TYPES.RECURRING).default(ACCOUNT_TYPES.FIXED),
    nominee: Joi.string().max(50).required(),
    installmentAmount: Joi.number().precision(2).optional(),
    principleAmount: Joi.number().precision(2).optional(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createSchema };

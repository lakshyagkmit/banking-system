const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//create account validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid(constants.ACCOUNT_TYPES.FIXED, constants.ACCOUNT_TYPES.RECURRING).required(),
    nominee: Joi.string().max(50).required(),
    installmentAmount: Joi.number().precision(2).optional(),
    principleAmount: Joi.number().precision(2).optional(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createSchema };

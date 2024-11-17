const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//create account validator
async function depositsCreateSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid(constants.ACCOUNT_TYPES.FIXED, constants.ACCOUNT_TYPES.RECURRING).required(),
    subtype: Joi.string().max(50).optional(),
    nominee: Joi.string().max(50).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { depositsCreateSchema };

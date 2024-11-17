const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//request account validator
async function accountsApplicationSchema(req, res, next) {
  const schema = Joi.object({
    branchIfscCode: Joi.string().max(20).required(),
    accountType: Joi.string()
      .valid(constants.ACCOUNT_TYPES.SAVINGS, constants.ACCOUNT_TYPES.CURRENT)
      .required(),
    accountSubtype: Joi.string().max(50).optional(),
    nomineeName: Joi.string().max(50).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

//request locker schema
async function lockersApplicationSchema(req, res, next) {
  const schema = Joi.object({
    lockerRequestDesc: Joi.string().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { accountsApplicationSchema, lockersApplicationSchema };

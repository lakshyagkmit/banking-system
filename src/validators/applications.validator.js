const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const { APPLICATION_TYPES } = require('../constants/constants');

//request account validator
async function accountSchema(req, res, next) {
  const schema = Joi.object({
    branchIfscCode: Joi.string().max(20).required(),
    type: Joi.string()
      .valid(APPLICATION_TYPES.SAVINGS, APPLICATION_TYPES.CURRENT)
      .default(APPLICATION_TYPES.SAVINGS),
    nomineeName: Joi.string().max(50).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

async function lockerSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid(APPLICATION_TYPES.LOCKER).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { accountSchema, lockerSchema };

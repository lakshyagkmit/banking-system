const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//request account validator
async function accountSchema(req, res, next) {
  const schema = Joi.object({
    branchIfscCode: Joi.string().max(20).required(),
    type: Joi.string()
      .valid(constants.APPLICATION_TYPES.SAVINGS, constants.APPLICATION_TYPES.CURRENT)
      .required(),
    nomineeName: Joi.string().max(50).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

async function lockerSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().valid(constants.APPLICATION_TYPES.LOCKER).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { accountSchema, lockerSchema };

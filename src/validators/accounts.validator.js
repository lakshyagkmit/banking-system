const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//create account validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    userId: Joi.string().guid({ version: 'uuidv4' }).required(),
    type: Joi.string().valid(constants.ACCOUNT_TYPES.SAVINGS, constants.ACCOUNT_TYPES.CURRENT).required(),
    nominee: Joi.string().max(50).required(),
    branchIfscCode: Joi.string().max(20).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

// account update schema
async function updateSchema(req, res, next) {
  const schema = Joi.object({
    nominee: Joi.string().max(50).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

async function idSchema(req, res, next) {
  const schema = Joi.object({
    accountId: Joi.string()
      .guid({
        version: ['uuidv4'],
      })
      .required(),

    transactionId: Joi.string()
      .guid({
        version: ['uuidv4'],
      })
      .optional(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createSchema, updateSchema, idSchema };

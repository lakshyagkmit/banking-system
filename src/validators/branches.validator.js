const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

// create branch validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    userId: Joi.string()
      .trim()
      .guid({ version: ['uuidv4'] })
      .required(),
    address: Joi.string(),
    ifscCode: Joi.string().max(20).required(),
    contact: Joi.string().required(),
    totalLockers: Joi.number().integer(),
  });
  validateHelper.validateRequest(req, res, next, schema, 'body');
}

async function updateSchema(req, res, next) {
  const schema = Joi.object({
    address: Joi.string().optional(),
    ifscCode: Joi.string().max(20).optional(),
    contact: Joi.string().optional(),
    totalLockers: Joi.number().integer().optional(),
  }).min(1);
  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { createSchema, updateSchema };

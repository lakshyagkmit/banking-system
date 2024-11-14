const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

async function limitPageSchema(req, res, next) {
  const schema = Joi.object({
    page: Joi.number().positive().max(100).default(1),
    limit: Joi.number().positive().min(1).max(100).default(10),
  });
  validateHelper.validateRequest(req, res, next, schema, 'query');
}

module.exports = { limitPageSchema };

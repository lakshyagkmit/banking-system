const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

async function querySchema(req, res, next) {
  const schema = Joi.object({
    page: Joi.number().positive().max(100).default(1),
    limit: Joi.number().positive().min(1).max(100).default(10),
    userRole: Joi.string().max(5).optional(),
  });
  validateHelper.validateRequest(req, res, next, schema, 'query');
}

const idSchema = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string()
      .guid({
        version: ['uuidv4'],
      })
      .required(),
  });
  validateHelper.validateRequest(req, res, next, schema, 'params');
};

module.exports = { querySchema, idSchema };

const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const constants = require('../constants/constants');

//request account validator
async function applicationSchema(req, res, next) {
  const schema = Joi.object({
    branchIfscCode: Joi.string().max(20).required(),
    type: Joi.string()
      .valid(...Object.values(constants.APPLICATION_TYPES))
      .required(),
    nomineeName: Joi.string().max(50).optional(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { applicationSchema };

const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');
const { ROLES, GOV_ISSUE_ID_TYPES } = require('../constants/constants');

// user creation validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    govIssueIdType: Joi.string()
      .valid(...Object.values(GOV_ISSUE_ID_TYPES))
      .default(GOV_ISSUE_ID_TYPES.ADHAR),
    fatherName: Joi.string().max(50),
    motherName: Joi.string().max(50),
    address: Joi.string(),
    isVerified: Joi.boolean().default(false),
    roleCode: Joi.string().valid(ROLES['102'], ROLES['103']).default(ROLES['103']),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

const updateSchema = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    contact: Joi.string()
      .pattern(/^\d{10}$/)
      .required(),
    fatherName: Joi.string().max(50).required(),
    motherName: Joi.string().max(50).required(),
    address: Joi.string().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
};

const rolesUpdateSchema = async (req, res, next) => {
  const schema = Joi.object({
    rolesToAdd: Joi.array()
      .items(
        Joi.string()
          .valid(ROLES['102'], ROLES['103'])
          .messages({
            'any.only': `Each roleToUpdate must be one of ${ROLES['102']} (Branch Manager) or ${ROLES['103']} (Customer).`,
          })
      )
      .optional()
      .messages({
        'array.base': 'rolesToUpdate must be an array.',
      }),
    rolesToRemove: Joi.array()
      .items(
        Joi.string()
          .valid(ROLES['102'], ROLES['103'])
          .messages({
            'any.only': `Each roleToRemove must be one of ${ROLES['102']} (Branch Manager) or ${ROLES['103']} (Customer).`,
          })
      )
      .optional()
      .messages({
        'array.base': 'rolesToRemove must be an array.',
      }),
  }).min(1);

  validateHelper.validateRequest(req, res, next, schema, 'body');
};

module.exports = { createSchema, updateSchema, rolesUpdateSchema };

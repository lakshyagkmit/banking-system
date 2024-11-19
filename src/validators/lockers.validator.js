const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

//assign locker validator
async function assignSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    lockerSerialNo: Joi.string().max(20).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

//create locker validator
async function createSchema(req, res, next) {
  const schema = Joi.object({
    numberOfLockers: Joi.number().required(),
    monthlyCharge: Joi.number().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

//update locker validator
async function updateSchema(req, res, next) {
  const schema = Joi.object({
    monthlyCharge: Joi.number().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { assignSchema, createSchema, updateSchema };

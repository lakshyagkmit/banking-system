const Joi = require('joi');
const validateHelper = require('../helpers/validates.helper');

//assign locker validator
async function lockerAssignSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    lockerSerialNo: Joi.string().max(20).required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

//create locker validator
async function createLockerSchema(req, res, next) {
  const schema = Joi.object({
    numberOfLockers: Joi.number().required(),
    monthlyCharge: Joi.number().required(),
  });

  validateHelper.validateRequest(req, res, next, schema, 'body');
}

module.exports = { lockerAssignSchema, createLockerSchema };

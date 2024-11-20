const _ = require('lodash');

async function customErrorHandler(req, res, message, statusCode = 400, error = null) {
  let errorMessage = 'Something went wrong. Please try again';

  console.log(error);
  if (message) {
    errorMessage = message;
  }

  if (error && error.message) {
    message = error.message;
  }
  req.error = error;

  const response = {
    message: errorMessage,
  };

  res.status(statusCode).json(response);
}

async function customError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function sendResponse(req, res) {
  const response = {
    message: res.message || 'Success',
  };

  if (res.data) {
    response.data = res.data;
  } else if (res.token) {
    response.token = res.token;
  }

  return res.status(res.statusCode || 200).json(response);
}

async function convertKeysToSnakeCase(obj) {
  if (Array.isArray(obj)) {
    console.error('Unexpected array value in input:', obj);
    throw new Error('Array values are not allowed');
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = _.snakeCase(key);
      const value = obj[key];

      if (typeof value === 'object' && !Array.isArray(value)) {
        result[snakeKey] = convertKeysToSnakeCase(value);
      } else {
        result[snakeKey] = value;
      }

      return result;
    }, {});
  }
  console.log('Processing primitive value:', obj);
  return obj;
}

module.exports = {
  customErrorHandler,
  customError,
  convertKeysToSnakeCase,
  sendResponse,
};

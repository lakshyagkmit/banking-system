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
    return obj.map(v => convertKeysToSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      result[_.snakeCase(key)] = convertKeysToSnakeCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

module.exports = {
  customErrorHandler,
  customError,
  convertKeysToSnakeCase,
  sendResponse,
};

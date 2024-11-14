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

function customError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function excludeFields(data) {
  const fieldsToExclude = ['created_at', 'updated_at', 'deleted_at', 'password'];

  if (Array.isArray(data)) {
    return data.map(item => excludeFields(item, fieldsToExclude));
  } else if (data && typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (!fieldsToExclude.includes(key)) {
        result[key] = data[key];
      }
    }
    return result;
  }
  return data;
}

function convertKeysToSnakeCase(obj) {
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

function convertKeysToCamelCase(data) {
  const cleanedData = excludeFields(data);

  if (Array.isArray(cleanedData)) {
    return cleanedData.map(item => convertKeysToCamelCase(item));
  } else if (cleanedData && typeof cleanedData === 'object') {
    return Object.keys(cleanedData).reduce((result, key) => {
      result[_.camelCase(key)] = convertKeysToCamelCase(cleanedData[key]);
      return result;
    }, {});
  }
  return cleanedData;
}

module.exports = {
  customErrorHandler,
  customError,
  convertKeysToSnakeCase,
  convertKeysToCamelCase,
};

const commonHelper = require('../../src/helpers/commonFunctions.helper');
const _ = require('lodash');

describe('customErrorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { error: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should send a response with a custom error message and status code', async () => {
    await commonHelper.customErrorHandler(req, res, 'Custom error message', 500);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Custom error message' });
  });

  it('should use default error message when no message is passed', async () => {
    await commonHelper.customErrorHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong. Please try again' });
  });

  it('should set error on the request object', async () => {
    const error = new Error('Test Error');
    await commonHelper.customErrorHandler(req, res, 'Some error', 400, error);
    expect(req.error).toBe(error);
  });
});

describe('customError', () => {
  it('should throw an error with the correct message and status code', async () => {
    const errorMessage = 'Custom error';
    const statusCode = 404;
    try {
      await commonHelper.customError(errorMessage, statusCode);
    } catch (error) {
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(statusCode);
    }
  });
});

describe('sendResponse', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should send a success response with message and data', async () => {
    res.data = { id: 1, name: 'Test' };
    res.message = 'Operation successful';
    await commonHelper.sendResponse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Operation successful', data: { id: 1, name: 'Test' } });
  });

  it('should send a success response with just message when data is not present', async () => {
    await commonHelper.sendResponse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Success' });
  });

  it('should send a response with a token if available', async () => {
    res.token = 'token';
    await commonHelper.sendResponse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Success', token: 'token' });
  });

  it('should handle custom status code', async () => {
    res.statusCode = 201;
    await commonHelper.sendResponse(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

jest.mock('lodash', () => ({
  snakeCase: jest.fn().mockImplementation(str => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }),
}));

describe('convertKeysToSnakeCase', () => {
  it('should convert object keys to snake_case', async () => {
    const input = { firstName: 'Java', lastName: 'script' };
    const expectedOutput = { first_name: 'Java', last_name: 'script' };

    const result = await commonHelper.convertKeysToSnakeCase(input);
    expect(result).toEqual(expectedOutput);
    expect(_.snakeCase).toHaveBeenCalledWith('firstName');
    expect(_.snakeCase).toHaveBeenCalledWith('lastName');
  });

  it('should handle nested objects', async () => {
    const input = { firstName: 'Java', address: { streetName: 'Main St' } };
    const expectedOutput = { first_name: 'Java', address: { street_name: 'Main St' } };

    const result = await commonHelper.convertKeysToSnakeCase(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should throw an error if the input is an array', async () => {
    const input = ['firstName', 'lastName'];
    await expect(commonHelper.convertKeysToSnakeCase(input)).rejects.toThrow('Array values are not allowed');
  });

  it('should return primitive values unchanged', async () => {
    const input = 'hello world';
    const result = await commonHelper.convertKeysToSnakeCase(input);
    expect(result).toBe('hello world');
  });

  it('should process null values correctly', async () => {
    const result = await commonHelper.convertKeysToSnakeCase(null);
    expect(result).toBeNull();
  });
});

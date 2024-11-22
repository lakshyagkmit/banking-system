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

const validateHelper = require('../../src/helpers/validates.helper');
const commonHelper = require('../../src/helpers/commonFunctions.helper');

jest.mock('../../src/helpers/commonFunctions.helper', () => ({
  customErrorHandler: jest.fn(),
}));

describe('validateRequest', () => {
  let req, res, next, schema;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    schema = {
      validate: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should call next() if validation is successful for body', () => {
    req.body = { name: 'John' };
    schema.validate.mockReturnValue({ value: { name: 'John' }, error: null });

    validateHelper.validateRequest(req, res, next, schema, 'body');

    expect(schema.validate).toHaveBeenCalledWith(req.body);
    expect(req.body).toEqual({ name: 'John' });
    expect(next).toHaveBeenCalled();
    expect(commonHelper.customErrorHandler).not.toHaveBeenCalled();
  });

  it('should call next() if validation is successful for query', () => {
    req.query = { age: 30 };
    schema.validate.mockReturnValue({ value: { age: 30 }, error: null });

    validateHelper.validateRequest(req, res, next, schema, 'query');

    expect(schema.validate).toHaveBeenCalledWith(req.query);
    expect(req.query).toEqual({ age: 30 });
    expect(next).toHaveBeenCalled();
    expect(commonHelper.customErrorHandler).not.toHaveBeenCalled();
  });

  it('should call next() if validation is successful for params', () => {
    req.params = { id: '123' };
    schema.validate.mockReturnValue({ value: { id: '123' }, error: null });

    validateHelper.validateRequest(req, res, next, schema, 'params');

    expect(schema.validate).toHaveBeenCalledWith(req.params);
    expect(req.params).toEqual({ id: '123' });
    expect(next).toHaveBeenCalled();
    expect(commonHelper.customErrorHandler).not.toHaveBeenCalled();
  });

  it('should call customErrorHandler if validation fails', () => {
    const validationError = new Error('Invalid data');
    schema.validate.mockReturnValue({ value: {}, error: validationError });

    validateHelper.validateRequest(req, res, next, schema, 'body');

    expect(schema.validate).toHaveBeenCalledWith(req.body);
    expect(commonHelper.customErrorHandler).toHaveBeenCalledWith(
      req,
      res,
      validationError.message,
      400,
      validationError
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate query parameters when requestParameterType is query', () => {
    req.query = { page: 10 };
    schema.validate.mockReturnValue({ value: { page: 10 }, error: null });

    validateHelper.validateRequest(req, res, next, schema, 'query');

    expect(schema.validate).toHaveBeenCalledWith(req.query);
    expect(req.query).toEqual({ page: 10 });
    expect(next).toHaveBeenCalled();
  });
});

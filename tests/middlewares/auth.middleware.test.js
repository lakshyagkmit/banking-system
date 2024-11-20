const authMiddleware = require('../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const constants = require('../../src/constants/constants');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('checkAuthToken', () => {
    it('should return 401 if no token is provided', () => {
      req.headers['authorization'] = null;

      authMiddleware.checkAuthToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Token is missing.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid or expired', () => {
      req.headers['authorization'] = 'Bearer invalid_token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authMiddleware.checkAuthToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', () => {
      req.headers['authorization'] = 'Bearer valid_token';
      const mockUser = { id: 1, role: 'admin' };
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authMiddleware.checkAuthToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET, expect.any(Function));
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    it('should return 403 if user role is not authorized', () => {
      req.user = { role: constants.ROLES['103'] };
      const middleware = authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden: You are not authorized to access this resource',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if user role is authorized', () => {
      req.user = { role: constants.ROLES['101'] };
      const middleware = authMiddleware.authorizeRole([constants.ROLES['101'], constants.ROLES['102']]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle a single role passed as a string', () => {
      req.user = { role: constants.ROLES['103'] };
      const middleware = authMiddleware.authorizeRole(constants.ROLES['103']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

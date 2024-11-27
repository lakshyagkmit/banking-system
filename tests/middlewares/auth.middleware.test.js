const jwt = require('jsonwebtoken');
const { checkAuthToken, authorizeRole } = require('../../src/middlewares/auth.middleware');
const { decryptJwt } = require('../../src/helpers/jwt.helper');

jest.mock('jsonwebtoken');
jest.mock('../../src/helpers/jwt.helper');

describe('Authorization Middleware', () => {
  const mockReq = {
    headers: {
      authorization: 'Bearer mockEncryptedToken',
    },
  };
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAuthToken', () => {
    it('should return 401 if token is missing', () => {
      const req = { headers: {} };

      checkAuthToken(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied. Token is missing.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid or expired', () => {
      decryptJwt.mockReturnValue('mockDecryptedToken');
      jwt.verify.mockImplementation((_, __, callback) => callback(new Error('Token expired')));

      checkAuthToken(mockReq, mockRes, mockNext);

      expect(decryptJwt).toHaveBeenCalledWith('mockEncryptedToken');
      expect(jwt.verify).toHaveBeenCalledWith(
        'mockDecryptedToken',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired token.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next if token is valid', () => {
      decryptJwt.mockReturnValue('mockDecryptedToken');
      jwt.verify.mockImplementation((_, __, callback) => callback(null, { id: 1, roles: ['user'] }));

      checkAuthToken(mockReq, mockRes, mockNext);

      expect(decryptJwt).toHaveBeenCalledWith('mockEncryptedToken');
      expect(jwt.verify).toHaveBeenCalledWith(
        'mockDecryptedToken',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(mockReq.user).toEqual({ id: 1, roles: ['user'] });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    const mockUserReq = {
      ...mockReq,
      user: {
        roles: ['admin', 'user'],
      },
    };

    it('should call next if user has the required role', () => {
      const middleware = authorizeRole('admin');
      middleware(mockUserReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have the required role', () => {
      const middleware = authorizeRole('superadmin');
      middleware(mockUserReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: You are not authorized to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple roles and allow access if any role matches', () => {
      const middleware = authorizeRole(['admin', 'superadmin']);
      middleware(mockUserReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 if none of the roles match', () => {
      const middleware = authorizeRole(['superadmin', 'editor']);
      middleware(mockUserReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: You are not authorized to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

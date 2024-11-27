const jwt = require('jsonwebtoken');
const { decryptJwt } = require('../helpers/jwt.helper');
const process = require('process');
const commonHelper = require('../helpers/commonFunctions.helper');

// checks user authorisation
function checkAuthToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token is missing.' });
    }

    const decryptedToken = decryptJwt(token);

    jwt.verify(decryptedToken, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
      req.user = user;
      next();
    });
  } catch (err) {
    commonHelper.customErrorHandler(req, res, err.message, 400, err);
  }
}

// check user role
function authorizeRole(code) {
  return (req, res, next) => {
    const roleArray = Array.isArray(code) ? code : [code];

    const userRoles = req.user.roles;
    const hasAccess = userRoles.some(role => roleArray.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to access this resource',
      });
    }

    next();
  };
}

module.exports = { checkAuthToken, authorizeRole };

const jwt = require('jsonwebtoken');
const process = require('process');

// checks user authorisation
function checkAuthToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token is missing.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// check user role
function authorizeRole(code) {
  return (req, res, next) => {
    const roleArray = Array.isArray(code) ? code : [code];

    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: You are not authorized to access this resource',
      });
    }
    next();
  };
}

module.exports = { checkAuthToken, authorizeRole };

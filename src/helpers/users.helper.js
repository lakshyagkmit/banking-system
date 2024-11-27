const { ROLES } = require('../constants/constants');

// Admin > Branch Manager > Customer
function getHighestRole(roles) {
  if (roles.includes(ROLES['101'])) return ROLES['101'];
  if (roles.includes(ROLES['102'])) return ROLES['102'];
  return ROLES['103'];
}

module.exports = {
  getHighestRole,
};

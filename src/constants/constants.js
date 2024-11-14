// constants.js

// Constants for account types
const ACCOUNT_TYPES = Object.freeze({
  SAVINGS: 'savings',
  CURRENT: 'current',
  FIXED: 'fixed',
  DEPOSIT: 'deposit',
});

// Constants for roles
const ROLES = Object.freeze({
  101: '101',
  102: '102',
  103: '103',
});

// Constants for government-issued ID types
const GOV_ISSUE_ID_TYPES = Object.freeze({
  PASSPORT: 'passport',
  DRIVER_LICENSE: "driver's license",
  ADHAR: 'adhar',
  PAN: 'pan',
  VOTER_ID: 'voter_id',
});

module.exports = {
  ACCOUNT_TYPES,
  ROLES,
  GOV_ISSUE_ID_TYPES,
};

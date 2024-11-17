// constants.js

// Constants for account types
const ACCOUNT_TYPES = Object.freeze({
  SAVINGS: 'savings',
  CURRENT: 'current',
  FIXED: 'fixed',
  RECURRING: 'recurring',
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

const TRANSACTION_TYPES = Object.freeze({
  WITHDRAWL: 'withdrawal',
  DEPOSIT: 'deposit',
  TRANSFER: 'transfer',
});

const PAYMENT_METHODS = Object.freeze({
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  IMPS: 'IMPS',
  UPI: 'UPI',
});

module.exports = {
  ACCOUNT_TYPES,
  ROLES,
  GOV_ISSUE_ID_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
};

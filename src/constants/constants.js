// Constants for account types
const ACCOUNT_TYPES = Object.freeze({
  SAVINGS: 'savings',
  CURRENT: 'current',
  FIXED: 'fixed',
  RECURRING: 'recurring',
});

// Constants for application types
const APPLICATION_TYPES = Object.freeze({
  SAVINGS: 'savings',
  CURRENT: 'current',
  LOCKER: 'locker',
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
  DRIVER_LICENSE: 'driver_license',
  ADHAR: 'adhar',
  PAN: 'pan',
  VOTER_ID: 'voter_id',
});

// Constants for transaction types
const TRANSACTION_TYPES = {
  WITHDRAWAL: 'withdrawal',
  DEPOSIT: 'deposit',
  TRANSFER: 'transfer',
};

// Constants for payment methods
const PAYMENT_METHODS = Object.freeze({
  CREDIT_CARD: 'Credit_Card',
  DEBIT_CARD: 'Debit_Card',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  IMPS: 'IMPS',
  UPI: 'UPI',
});

// Constants for transaction status
const TRANSACTION_STATUS = Object.freeze({
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
});

// constants for status
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const LOCKER_STATUS = {
  AVAILABLE: 'available',
  FREEZED: 'freezed',
};

module.exports = {
  ACCOUNT_TYPES,
  APPLICATION_TYPES,
  ROLES,
  GOV_ISSUE_ID_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
  STATUS,
  LOCKER_STATUS,
};

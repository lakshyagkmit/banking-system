const { User, UserAccount, AccountPolicy } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const accountHelper = require('../helpers/accounts.helper');
const notificationHelper = require('../helpers/notifications.helper');
const { ACCOUNT_TYPES } = require('../constants/constants');

// Create a  new deposit account
async function create(payload) {
  const { data, user } = payload;
  const { type, nominee, installmentAmount, principleAmount } = data;
  const { id } = user;

  if (type === ACCOUNT_TYPES.FIXED && !principleAmount) {
    return commonHelper.customError('Please add principle amount to proceed further', 400);
  }

  if (type === ACCOUNT_TYPES.RECURRING && !installmentAmount) {
    return commonHelper.customError('Please add installment amount to proceed further', 400);
  }

  const account = await UserAccount.findOne({
    where: {
      user_id: id,
      status: 'active',
    },
    include: {
      model: User,
      where: { id },
    },
  });

  if (!account) {
    return commonHelper.customError(
      'No primary account found for the user. Please create a primary account first.',
      400
    );
  }

  const policy = await AccountPolicy.findOne({
    where: { account_type: type },
  });
  if (!policy) {
    return commonHelper.customError('Invalid type', 409);
  }

  if (installmentAmount) {
    if (installmentAmount < policy.minimum_amount) {
      return commonHelper.customError('Provided amount is less than defined minimum amount.', 409);
    }
  } else if (principleAmount) {
    if (principleAmount < policy.minimum_amount) {
      return commonHelper.customError('Provided amount is less than defined minimum amount.', 409);
    }
  }

  const accountNumber = accountHelper.generateAccountNumber();

  const lockInPeriodMonths = policy.lock_in_period;
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + lockInPeriodMonths);

  const deposit = await UserAccount.create({
    policy_id: policy.id,
    branch_id: account.branch_id,
    user_id: id,
    type,
    number: accountNumber,
    interest_rate: policy.interest_rate,
    nominee,
    installment_amount: type === ACCOUNT_TYPES.RECURRING ? parseFloat(installmentAmount).toFixed(2) : null,
    principle_amount: type === ACCOUNT_TYPES.FIXED ? parseFloat(principleAmount).toFixed(2) : null,
    maturity_date: maturityDate,
  });

  notificationHelper.accountCreationNotification(account.User.email, type, accountNumber);

  return deposit;
}

module.exports = { create };

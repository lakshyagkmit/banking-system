const { User, UserAccount, Branch, AccountPolicy, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const accountHelper = require('../helpers/accounts.helper');
const notificationHelper = require('../helpers/notifications.helper');
const { ACCOUNT_TYPES } = require('../constants/constants');

// Create a  new deposit account
async function create(payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const { type, nominee, installmentAmount, principleAmount } = payload;
    const { id } = user;

    if (type === ACCOUNT_TYPES.FIXED && !principleAmount) {
      return commonHelper.customError('Please add principle amount to proceed further', 400);
    }

    if (type === ACCOUNT_TYPES.RECURRING && !installmentAmount) {
      return commonHelper.customError('Please add installment amount to proceed further', 400);
    }

    const customer = await User.findByPk(id);

    const account = await UserAccount.findOne({ where: { user_id: id, status: 'active' } });
    if (!account) {
      return commonHelper.customError(
        'No primary account found for the user. Please create a primary account first.',
        400
      );
    }

    const branch = await Branch.findOne({ where: { id: account.branch_id } });
    if (!branch) {
      return commonHelper.customError('Branch associated with the account is not found.', 404);
    }

    const policy = await AccountPolicy.findOne({
      where: { account_type: type },
    });
    if (!policy) {
      return commonHelper.customError('Invalid type and subtype combination.', 409);
    }
    if (!policy.lock_in_period) {
      return commonHelper.customError('Lock-in period is not defined for the selected policy.', 409);
    }
    if (!policy.minimum_amount) {
      return commonHelper.customError('Policy minimum amount is not defined.', 409);
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
    const existingAccount = await UserAccount.findOne({ where: { number: accountNumber } });
    if (existingAccount) {
      return commonHelper.customError('Generated account number already exists. Please retry.', 409);
    }

    const lockInPeriodMonths = policy.lock_in_period;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + lockInPeriodMonths);

    const deposit = await UserAccount.create(
      {
        policy_id: policy.id,
        branch_id: account.branch_id,
        user_id: id,
        type,
        number: accountNumber,
        interest_rate: policy.interest_rate,
        nominee,
        installment_amount:
          type === ACCOUNT_TYPES.RECURRING ? parseFloat(installmentAmount).toFixed(2) : null,
        principle_amount: type === ACCOUNT_TYPES.FIXED ? parseFloat(principleAmount).toFixed(2) : null,
        maturity_date: maturityDate,
      },
      { transaction }
    );

    await transaction.commit();
    notificationHelper.accountCreationNotification(customer.email, type, accountNumber);

    return deposit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create };

const { Account, Branch, Policy, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const accountHelper = require('../helpers/accounts.helper');
const constants = require('../constants/constants');

// Create a  new deposit account
async function create(payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const { type, subtype, nominee } = payload;
    const { id } = user;

    const account = await Account.findOne({ where: { user_id: id, status: 'active' } });
    if (!account) {
      commonHelper.customError(
        'No primary account found for the user. Please create a primary account first.',
        400
      );
    }

    const branch = await Branch.findOne({ where: { id: account.branch_id } });
    if (!branch) {
      commonHelper.customError('Branch associated with the account is not found.', 404);
    }

    const policy = await Policy.findOne({
      where: { account_type: type, account_subtype: subtype },
    });
    if (!policy) {
      commonHelper.customError('Invalid type and subtype combination.', 409);
    }
    if (!policy.lock_in_period) {
      commonHelper.customError('Lock-in period is not defined for the selected policy.', 409);
    }
    if (!policy.minimum_amount) {
      commonHelper.customError('Policy minimum amount is not defined.', 409);
    }

    const accountNumber = accountHelper.generateAccountNumber();
    const existingAccount = await Account.findOne({ where: { number: accountNumber } });
    if (existingAccount) {
      commonHelper.customError('Generated account number already exists. Please retry.', 500);
    }

    const lockInPeriodMonths = policy.lock_in_period;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + lockInPeriodMonths);

    const deposit = await Account.create(
      {
        policy_id: policy.id,
        branch_id: account.branch_id,
        user_id: id,
        type,
        subtype,
        number: accountNumber,
        balance: 0,
        interest_rate: policy.interest_rate,
        nominee,
        installment_amount: type === constants.ACCOUNT_TYPES.RECURRING ? policy.minimum_amount : null,
        principle_amount: type === constants.ACCOUNT_TYPES.FIXED ? policy.minimum_amount : null,
        maturity_date: maturityDate,
      },
      { transaction }
    );

    await transaction.commit();

    return deposit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create };

const { Bank, AccountPolicy, UserAccount, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');

// create new policy
async function create(payload) {
  const transaction = await sequelize.transaction();

  try {
    const { accountType, initialAmount, interestRate, minimumAmount, lockInPeriod, penaltyFee } = payload;

    const existingPolicy = await AccountPolicy.findOne({
      where: {
        account_type: accountType,
      },
    });

    if (existingPolicy) {
      return commonHelper.customError(
        'Policy with same account type and subtype exists, please use another type or subtype',
        409
      );
    }

    const bank = await Bank.findOne();

    const newPolicy = await AccountPolicy.create(
      {
        bank_id: bank.id,
        account_type: accountType,
        initial_amount: initialAmount,
        interest_rate: interestRate,
        minimum_amount: minimumAmount,
        lock_in_period: lockInPeriod,
        penalty_fee: penaltyFee,
      },
      { transaction }
    );
    await transaction.commit();

    return newPolicy;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// list all policies
async function index(query) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const policies = await AccountPolicy.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  if (!policies.rows.length) {
    return commonHelper.customError('No policies found', 404);
  }

  return {
    rows: policies.rows,
    totalPolicies: policies.count,
    currentPage: page,
    totalPages: Math.ceil(policies.count / limit),
  };
}

// get a policy by id
async function view(id) {
  return AccountPolicy.findByPk(id);
}

// update a policy by id
async function update(id, payload) {
  const transaction = await sequelize.transaction();
  try {
    const policy = await AccountPolicy.findByPk(id);
    if (!policy) {
      return commonHelper.customError('Policy not found', 404);
    }

    const data = commonHelper.convertKeysToSnakeCase(payload);

    const updatedPolicy = await policy.update(data, { transaction });
    await transaction.commit();

    return updatedPolicy;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// delete policy by id
async function remove(id) {
  const transaction = await sequelize.transaction();
  try {
    const policy = await AccountPolicy.findByPk(id);
    if (!policy) {
      return commonHelper.customError('Policy not found', 404);
    }

    const account = UserAccount.findOne({
      where: { policy_id: policy.id },
    });

    if (account) {
      return commonHelper.customError('Account exists with this policy, policy cannot be deleted', 409);
    }

    await policy.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create, index, view, update, remove };

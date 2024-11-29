const { Bank, AccountPolicy, UserAccount } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');

// create new policy
async function create(payload) {
  const { data } = payload;
  const { accountType, initialAmount, interestRate, minimumAmount, lockInPeriod, penaltyFee } = data;

  const existingPolicy = await AccountPolicy.findOne({
    where: {
      account_type: accountType,
      interest_rate: interestRate,
      initial_amount: initialAmount,
    },
  });

  if (existingPolicy) return commonHelper.customError('Policy already exists', 409);

  const bank = await Bank.findOne();

  const newPolicy = await AccountPolicy.create({
    bank_id: bank.id,
    account_type: accountType,
    initial_amount: initialAmount,
    interest_rate: interestRate,
    minimum_amount: minimumAmount,
    lock_in_period: lockInPeriod,
    penalty_fee: penaltyFee,
  });

  return newPolicy;
}

// list all policies
async function index(payload) {
  const { query } = payload;
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const policies = await AccountPolicy.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  return {
    policies: policies.rows,
    totalPolicies: policies.count,
    currentPage: page,
    totalPages: Math.ceil(policies.count / limit),
  };
}

// get a policy by id
async function view(id) {
  const policy = await AccountPolicy.findByPk(id);
  if (!policy) {
    return commonHelper.customError('Policy not found', 404);
  }
  return policy;
}

// update a policy by id
async function update(payload) {
  const { id, data } = payload;
  const { interestRate, penaltyFee } = data;

  const policy = await AccountPolicy.findByPk(id);
  if (!policy) {
    return commonHelper.customError('Policy not found', 404);
  }

  const updatedPolicy = await policy.update({
    interest_rate: interestRate,
    penalty_fee: penaltyFee,
  });

  return updatedPolicy;
}

// delete policy by id
async function remove(id) {
  const policy = await AccountPolicy.findByPk(id);
  if (!policy) {
    return commonHelper.customError('Policy not found', 404);
  }

  const account = await UserAccount.findOne({
    where: { policy_id: policy.id },
  });

  if (account) {
    return commonHelper.customError('Account exists with this policy, policy cannot be deleted', 409);
  }

  await policy.destroy();

  return { message: 'Policy deleted successfully' };
}

module.exports = { create, index, view, update, remove };

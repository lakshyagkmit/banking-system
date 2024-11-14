const { Bank, Policy, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');

// create new policy
async function create(payload) {
  const transaction = await sequelize.transaction();

  try {
    const { accountType, accountSubtype, interestRate, minimumAmount, lockInPeriod, penaltyFee } = payload;

    const existingPolicy = await Policy.findOne({
      where: {
        account_type: accountType,
        account_subtype: accountSubtype,
      },
    });

    if (existingPolicy) {
      commonHelper.customError(
        'Policy with same account type and subtype exists, please use another type or subtype',
        409
      );
    }

    const bank = await Bank.findOne();

    const newPolicy = await Policy.create(
      {
        bank_id: bank.id,
        account_type: accountType,
        account_subtype: accountSubtype,
        interest_rate: interestRate,
        minimum_amount: minimumAmount,
        lock_in_period: lockInPeriod,
        penalty_fee: penaltyFee,
      },
      { transaction }
    );
    await transaction.commit();
    return commonHelper.convertKeysToCamelCase(newPolicy.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// list all policies
async function list(query) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const policies = await Policy.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  if (!policies.rows.length) {
    commonHelper.customError('No policies found', 404);
  }

  const policiesData = policies.rows.map(policy => commonHelper.convertKeysToCamelCase(policy.dataValues));

  return {
    policies: policiesData,
    totalPolicies: policies.count,
    currentPage: page,
    totalPages: Math.ceil(policies.count / limit),
  };
}

// get a policy by id
async function listById(id) {
  const policy = await Policy.findByPk(id);
  return commonHelper.convertKeysToCamelCase(policy.dataValues);
}

module.exports = { create, list, listById };

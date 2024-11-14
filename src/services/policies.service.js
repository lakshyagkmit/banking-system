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

module.exports = { create };

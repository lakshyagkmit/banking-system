const cron = require('node-cron');
const { Account, sequelize } = require('../models');
const { Op } = require('sequelize');
const constants = require('../constants/constants');

async function applyYearlyInterest() {
  const transaction = await sequelize.transaction();

  try {
    const accounts = await Account.findAll({
      where: {
        type: [constants.ACCOUNT_TYPES.FIXED, constants.ACCOUNT_TYPES.RECURRING],
        maturity_date: { [Op.gt]: new Date() },
        status: 'active',
      },
    });

    for (const account of accounts) {
      const { balance, interest_rate, maturity_date } = account;

      const interestAmount = (balance * interest_rate) / 100;

      const newBalance = parseFloat(balance) + interestAmount;

      const currentDate = new Date();
      const accountMaturityDate = new Date(maturity_date);

      if (accountMaturityDate >= currentDate) {
        await account.update({ balance: newBalance }, { transaction });
      }
    }

    await transaction.commit();
    console.log('Yearly interest applied successfully!');
  } catch (error) {
    await transaction.rollback();
    console.error('Error applying yearly interest:', error);
  }
}

cron.schedule('0 0 1 1 *', async () => {
  console.log('Running yearly interest scheduler...');
  await applyYearlyInterest();
});

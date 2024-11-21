const cron = require('node-cron');
const { UserAccount, AccountPolicy, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ACCOUNT_TYPES } = require('../constants/constants');

async function applyYearlyInterest() {
  const transaction = await sequelize.transaction();
  try {
    const accounts = await UserAccount.findAll({
      where: {
        type: [ACCOUNT_TYPES.FIXED, ACCOUNT_TYPES.RECURRING],
        maturity_date: { [Op.gt]: new Date() },
        status: 'active',
      },
      include: [
        {
          model: AccountPolicy,
          attributes: ['interest_rate'],
        },
      ],
    });

    for (const account of accounts) {
      const { balance, maturity_date, AccountPolicy } = account;
      const { interest_rate } = AccountPolicy;

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

async function inactivateZeroBalanceAccounts() {
  try {
    const TEN_DAYS_AGO = new Date();
    TEN_DAYS_AGO.setDate(TEN_DAYS_AGO.getDate() - 10);

    const accounts = await UserAccount.findAll({
      where: {
        balance: 0,
        created_at: { [Op.lte]: TEN_DAYS_AGO },
        status: 'active',
      },
    });

    for (const account of accounts) {
      await account.update({ status: 'inactive' });
    }

    console.log('Inactive zero-balance accounts updated successfully!');
  } catch (error) {
    console.error('Error inactivating zero-balance accounts:', error);
  }
}

function startCronJobs() {
  cron.schedule('0 0 1 1 *', async () => {
    console.log('Running yearly interest scheduler...');
    await applyYearlyInterest();
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('Running zero-balance account inactivity scheduler...');
    await inactivateZeroBalanceAccounts();
  });
}

module.exports = startCronJobs;

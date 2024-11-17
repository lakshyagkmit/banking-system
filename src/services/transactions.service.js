const { Transaction, Account, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const constants = require('../constants/constants');

// This function processes account transactions including withdrawal, deposit, and
// transfer by validating account status, balance, and transaction details, ensuring data consistency via transactions.
async function create(params, payload) {
  const transaction = await sequelize.transaction();
  let debitTransaction, creditTransaction;

  try {
    const { type, amount, fee, paymentMethod, toAccountNo } = payload;
    const { id } = params;

    const account = await Account.findByPk(id);

    if (!account) commonHelper.customError('Account not found', 404);

    if (type === constants.TRANSACTION_TYPES.WITHDRAWAL) {
      if (account.status === 'inactive') {
        commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      if (account.balance < amount + fee) {
        commonHelper.customError('Insufficient funds for withdrawal', 409);
      }

      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore - amount - fee;

      await account.update({ balance: balanceAfter }, { transaction });

      debitTransaction = await Transaction.create(
        {
          account_id: account.id,
          type,
          payment_method: paymentMethod,
          amount,
          fee: fee || 0,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      return { message: 'Withdrawal successful' };
    } else if (type === constants.TRANSACTION_TYPES.DEPOSIT) {
      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore + amount;

      await account.update({ balance: balanceAfter, status: 'active' }, { transaction });

      // Create transaction record
      creditTransaction = await Transaction.create(
        {
          account_id: account.id,
          type,
          payment_method: paymentMethod,
          amount,
          fee: 0,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      return { message: 'Deposit successful' };
    }

    if (type === constants.TRANSACTION_TYPES.TRANSFER) {
      if (account.status === 'inactive') {
        commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }
      const toAccount = await Account.findOne({ where: { number: toAccountNo } });

      if (!toAccount) commonHelper.customError('Destination account not found', 400);

      if (account.balance < amount + fee) {
        commonHelper.customError('Insufficient funds for transfer', 409);
      }

      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore - amount - fee;

      const toBalanceBefore = toAccount.balance;
      const toBalanceAfter = toBalanceBefore + amount;

      await account.update({ balance: balanceAfter }, { transaction });
      await toAccount.update({ balance: toBalanceAfter, status: 'active' }, { transaction });

      debitTransaction = await Transaction.create(
        {
          account_id: account.id,
          to_account_no: toAccountNo,
          type: 'transfer',
          payment_method: paymentMethod,
          amount,
          fee,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      creditTransaction = await Transaction.create(
        {
          account_id: toAccount.id,
          from_account_no: account.number,
          type: 'transfer',
          payment_method: paymentMethod,
          amount,
          fee: 0,
          balance_before: toBalanceBefore,
          balance_after: toBalanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      return { message: 'Transfer successful' };
    }

    throw new Error('Invalid transaction type');
  } catch (error) {
    await transaction.rollback();

    if (debitTransaction) {
      await debitTransaction.update({ status: 'failed' }).catch(() => {
        console.error('Failed to update debit transaction status to failed');
      });
    }
    if (creditTransaction) {
      await creditTransaction.update({ status: 'failed' }).catch(() => {
        console.error('Failed to update credit transaction status to failed');
      });
    }

    throw error;
  }
}

module.exports = { create };

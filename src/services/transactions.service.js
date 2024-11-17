const { Transaction, Account, Branch, sequelize } = require('../models');
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

const list = async (accountId, query, user) => {
  const { page, limit } = query;
  const { id, role } = user;

  const account = await Account.findByPk(accountId);

  if (!account) {
    throw commonHelper.customError('Account not found', 404);
  }

  const offset = (page - 1) * limit;

  let transactions;
  if (role === constants.ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: id },
    });

    if (branch.id !== account.branch_id) {
      throw commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }

    transactions = await Transaction.findAndCountAll({
      where: { account_id: accountId },
      offset: offset,
      limit: limit,
    });
  } else if (role === constants.ROLES['103'] && account.user_id === id) {
    transactions = await Transaction.findAndCountAll({
      where: { account_id: accountId },
      offset: offset,
      limit: limit,
    });
  }

  if (!transactions.rows.length) {
    commonHelper.customError('No transactions found', 404);
  }

  return {
    totalItems: transactions.count,
    totalPages: Math.ceil(transactions.count / limit),
    currentPage: page,
    data: transactions.rows,
  };
};

const listById = async (accountId, transactionId, user) => {
  const { id, role } = user;

  const account = await Account.findByPk(accountId);

  if (!account) {
    throw commonHelper.customError('Account not found', 404);
  }

  let transaction;
  if (role === constants.ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: id },
    });

    if (branch.id !== account.branch_id) {
      throw commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }

    transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        account_id: accountId,
      },
    });
  } else if (role === constants.ROLES['103'] && account.user_id === id) {
    transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        account_id: accountId,
      },
    });
  }

  if (!transaction) {
    throw commonHelper.customError('Transaction not found', 404);
  }

  return transaction;
};

module.exports = { create, list, listById };

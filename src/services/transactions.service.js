const { User, Transaction, Account, Branch, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const notificationHelper = require('../helpers/notifications.helper');
const constants = require('../constants/constants');

// This function processes account transactions including withdrawal, deposit, and
// transfer by validating account status, balance, and transaction details, ensuring data consistency via transactions.
async function create(params, payload, user) {
  const transaction = await sequelize.transaction();
  let debitTransaction, creditTransaction;

  try {
    const { type, amount, fee, paymentMethod, toAccountNo } = payload;
    const { accountId } = params;
    const customerId = user.id;

    const customer = await User.findByPk(customerId);
    const account = await Account.findByPk(accountId);

    if (!account) commonHelper.customError('Account not found', 404);

    const parsedAmount = parseFloat(amount);
    const parsedFee = parseFloat(fee || 0);

    if (
      (account.type === constants.ACCOUNT_TYPES.FIXED ||
        account.type === constants.ACCOUNT_TYPES.RECURRING) &&
      account.maturity_date
    ) {
      const maturityDate = new Date(account.maturity_date);
      const currentDate = new Date();
      if (currentDate < maturityDate) {
        commonHelper.customError(
          `Transactions are not allowed for ${account.type} accounts before the maturity date: ${maturityDate.toISOString().split('T')[0]}`,
          400
        );
      }
    }

    if (type === constants.TRANSACTION_TYPES.WITHDRAWAL) {
      if (account.status === 'inactive') {
        commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      const balanceBefore = parseFloat(account.balance);
      if (balanceBefore < parsedAmount + parsedFee) {
        commonHelper.customError('Insufficient funds for withdrawal', 409);
      }

      const balanceAfter = parseFloat((balanceBefore - parsedAmount - parsedFee).toFixed(2));

      await account.update({ balance: balanceAfter }, { transaction });

      debitTransaction = await Transaction.create(
        {
          account_id: account.id,
          type,
          payment_method: paymentMethod,
          amount: parsedAmount,
          fee: parsedFee,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      await notificationHelper.transactionNotification(
        customer.email,
        type,
        parsedAmount,
        balanceBefore,
        balanceAfter
      );
      return { message: 'Withdrawal successful' };
    } else if (type === constants.TRANSACTION_TYPES.DEPOSIT) {
      const balanceBefore = parseFloat(account.balance);
      const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));

      await account.update({ balance: balanceAfter, status: 'active' }, { transaction });

      creditTransaction = await Transaction.create(
        {
          account_id: account.id,
          type,
          payment_method: paymentMethod,
          amount: parsedAmount,
          fee: 0,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      await notificationHelper.transactionNotification(
        customer.email,
        type,
        parsedAmount,
        balanceBefore,
        balanceAfter
      );
      return { message: 'Deposit successful' };
    }

    if (type === constants.TRANSACTION_TYPES.TRANSFER) {
      if (account.status === 'inactive') {
        commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      const toAccount = await Account.findOne({ where: { number: toAccountNo } });
      if (!toAccount) commonHelper.customError('Destination account not found', 400);

      const toAccountCustomer = await User.findByPk(toAccount.user_id);

      const balanceBefore = parseFloat(account.balance);
      if (balanceBefore < parsedAmount + parsedFee) {
        commonHelper.customError('Insufficient funds for transfer', 409);
      }

      const balanceAfter = parseFloat((balanceBefore - parsedAmount - parsedFee).toFixed(2));
      const toBalanceBefore = parseFloat(toAccount.balance);
      const toBalanceAfter = parseFloat((toBalanceBefore + parsedAmount).toFixed(2));

      await account.update({ balance: balanceAfter }, { transaction });
      await toAccount.update({ balance: toBalanceAfter, status: 'active' }, { transaction });

      debitTransaction = await Transaction.create(
        {
          account_id: account.id,
          to_account_no: toAccountNo,
          type: 'transfer',
          payment_method: paymentMethod,
          amount: parsedAmount,
          fee: parsedFee,
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
          amount: parsedAmount,
          fee: 0,
          balance_before: toBalanceBefore,
          balance_after: toBalanceAfter,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      await notificationHelper.transactionNotification(
        customer.email,
        type,
        parsedAmount,
        balanceBefore,
        balanceAfter
      );
      await notificationHelper.transactionNotification(
        toAccountCustomer.email,
        type,
        parsedAmount,
        toBalanceBefore,
        toBalanceAfter
      );
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

// list transactions
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

// list transactions by id
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

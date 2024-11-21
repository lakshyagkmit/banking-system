const { User, Transaction, UserAccount, Branch, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const notificationHelper = require('../helpers/notifications.helper');
const {
  ACCOUNT_TYPES,
  STATUS,
  ROLES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require('../constants/constants');

// This function processes account transactions including withdrawal, deposit, and
// transfer by validating account status, balance, and transaction details, ensuring data consistency via transactions.
async function create(accountId, payload, user) {
  const transaction = await sequelize.transaction();
  let debitTransaction, creditTransaction;

  try {
    const { type, amount, fee, paymentMethod, accountNo } = payload;
    const customerId = user.id;

    const customer = await User.findByPk(customerId);
    const account = await UserAccount.findByPk(accountId);

    if (!account) return commonHelper.customError('Account not found', 404);

    const parsedAmount = parseFloat(amount);
    const parsedFee = parseFloat(fee || 0);

    if (
      (account.type === ACCOUNT_TYPES.FIXED || account.type === ACCOUNT_TYPES.RECURRING) &&
      account.maturity_date
    ) {
      const maturityDate = new Date(account.maturity_date);
      const currentDate = new Date();
      if (currentDate < maturityDate) {
        return commonHelper.customError(
          `Transactions are not allowed for ${account.type} accounts before the maturity date: ${maturityDate.toISOString().split('T')[0]}`,
          400
        );
      }
    }

    if (type === TRANSACTION_TYPES.WITHDRAWAL) {
      if (account.status === STATUS.INACTIVE) {
        return commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      const balanceBefore = parseFloat(account.balance);
      if (balanceBefore < parsedAmount + parsedFee) {
        return commonHelper.customError('Insufficient funds for withdrawal', 409);
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
          status: TRANSACTION_STATUS.COMPLETED,
        },
        { transaction }
      );

      await transaction.commit();
      notificationHelper.transactionNotification(
        customer.email,
        type,
        parsedAmount,
        balanceBefore,
        balanceAfter
      );

      return { message: 'Withdrawal successful' };
    } else if (type === TRANSACTION_TYPES.DEPOSIT) {
      const balanceBefore = parseFloat(account.balance);
      const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));

      await account.update({ balance: balanceAfter, status: STATUS.ACTIVE }, { transaction });

      creditTransaction = await Transaction.create(
        {
          account_id: account.id,
          type,
          payment_method: paymentMethod,
          amount: parsedAmount,
          fee: 0,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: TRANSACTION_STATUS.COMPLETED,
        },
        { transaction }
      );

      await transaction.commit();
      notificationHelper.transactionNotification(
        customer.email,
        type,
        parsedAmount,
        balanceBefore,
        balanceAfter
      );

      return { message: 'Deposit successful' };
    }

    if (account.status === STATUS.INACTIVE) {
      return commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
    }

    if (!accountNo) return commonHelper.customError('Please write destination account no.', 400);
    if (accountNo === account.number)
      return commonHelper.customError('Source account and destination account cannot be same', 409);

    const toAccount = await UserAccount.findOne({ where: { number: accountNo } });
    if (!toAccount) return commonHelper.customError('Destination account not found', 400);

    const toAccountCustomer = await User.findByPk(toAccount.user_id);

    const balanceBefore = parseFloat(account.balance);
    if (balanceBefore < parsedAmount + parsedFee) {
      return commonHelper.customError('Insufficient funds for transfer', 409);
    }

    const balanceAfter = parseFloat((balanceBefore - parsedAmount - parsedFee).toFixed(2));
    const toBalanceBefore = parseFloat(toAccount.balance);
    const toBalanceAfter = parseFloat((toBalanceBefore + parsedAmount).toFixed(2));

    await account.update({ balance: balanceAfter }, { transaction });
    await toAccount.update({ balance: toBalanceAfter, status: STATUS.ACTIVE }, { transaction });

    debitTransaction = await Transaction.create(
      {
        account_id: account.id,
        account_no: accountNo,
        type,
        payment_method: paymentMethod,
        amount: parsedAmount,
        fee: parsedFee,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: TRANSACTION_STATUS.COMPLETED,
      },
      { transaction }
    );

    creditTransaction = await Transaction.create(
      {
        account_id: toAccount.id,
        account_no: account.number,
        type,
        payment_method: paymentMethod,
        amount: parsedAmount,
        fee: 0,
        balance_before: toBalanceBefore,
        balance_after: toBalanceAfter,
        status: TRANSACTION_STATUS.COMPLETED,
      },
      { transaction }
    );

    await transaction.commit();
    notificationHelper.transactionNotification(
      customer.email,
      type,
      parsedAmount,
      balanceBefore,
      balanceAfter
    );
    notificationHelper.transactionNotification(
      toAccountCustomer.email,
      type,
      parsedAmount,
      toBalanceBefore,
      toBalanceAfter
    );

    return { message: 'Transfer successful' };
  } catch (error) {
    await transaction.rollback();

    if (debitTransaction) {
      await debitTransaction.update({ status: TRANSACTION_STATUS.FAILED }).catch(() => {
        console.error('Failed to update debit transaction status to failed');
      });
    }
    if (creditTransaction) {
      await creditTransaction.update({ status: TRANSACTION_STATUS.FAILED }).catch(() => {
        console.error('Failed to update credit transaction status to failed');
      });
    }

    throw error;
  }
}

// list transactions
async function index(accountId, query, user) {
  const { page, limit } = query;
  const { id, role } = user;

  const offset = (page - 1) * limit;

  let transactions;
  if (role === ROLES['102']) {
    const account = UserAccount.findByPk(accountId);

    const branch = await Branch.findOne({
      where: { user_id: id },
    });

    if (branch.id !== account.branch_id) {
      return commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }

    transactions = await Transaction.findAndCountAll({
      where: { account_id: accountId },
      offset: offset,
      limit: limit,
      order: [['created_at', 'DESC']],
    });
  } else if (role === ROLES['103']) {
    const account = await UserAccount.findOne({
      where: {
        id: accountId,
      },
      include: {
        model: User,
        where: { id },
      },
    });

    if (!account) {
      return commonHelper.customError('Account not found', 404);
    }

    transactions = await Transaction.findAndCountAll({
      where: { account_id: accountId },
      offset: offset,
      limit: limit,
      order: [['created_at', 'DESC']],
    });
  }

  if (!transactions.rows.length) {
    return commonHelper.customError('No transactions found', 404);
  }

  return {
    totalItems: transactions.count,
    totalPages: Math.ceil(transactions.count / limit),
    currentPage: page,
    transactions: transactions.rows,
  };
}

// list transactions by id
async function view(accountId, transactionId, user) {
  const { id, role } = user;

  const account = await UserAccount.findByPk(accountId);

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  let transaction;
  if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: id },
    });

    if (branch.id !== account.branch_id) {
      return commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }

    transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        account_id: accountId,
      },
    });
  } else if (role === ROLES['103'] && account.user_id === id) {
    transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        account_id: accountId,
      },
    });
  }

  if (!transaction) {
    return commonHelper.customError('Transaction not found', 404);
  }

  return transaction;
}

module.exports = { create, index, view };

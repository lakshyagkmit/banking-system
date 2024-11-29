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
async function create(payload) {
  const { accountId, data, user } = payload;
  const { type, amount, fee, paymentMethod, accountNo } = data;
  const customerId = user.id;

  const parsedAmount = parseFloat(amount);
  const parsedFee = parseFloat(fee || 0);

  const account = await UserAccount.findOne({
    where: { id: accountId },
    include: { model: User, where: { id: customerId } },
  });

  if (!account) return commonHelper.customError('Account not found', 404);

  if (
    [ACCOUNT_TYPES.FIXED, ACCOUNT_TYPES.RECURRING].includes(account.type) &&
    account.maturity_date &&
    new Date() < new Date(account.maturity_date)
  ) {
    return commonHelper.customError(
      `Transactions are not allowed for ${account.type} accounts before maturity date: ${account.maturity_date.toISOString().split('T')[0]}`,
      400
    );
  }

  const userTransaction = await Transaction.create({
    account_id: accountId,
    type,
    payment_method: paymentMethod,
    amount: parsedAmount,
    fee: parsedFee,
    balance_before: account.balance,
    balance_after: account.balance,
    status: TRANSACTION_STATUS.PENDING,
  });

  const transaction = await sequelize.transaction();
  try {
    const balanceBefore = parseFloat(account.balance);
    let balanceAfter;

    if (type === TRANSACTION_TYPES.WITHDRAWAL) {
      if (account.status === STATUS.INACTIVE) {
        return commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      if (balanceBefore < parsedAmount + parsedFee) {
        return commonHelper.customError('Insufficient funds for withdrawal', 409);
      }

      balanceAfter = parseFloat((balanceBefore - parsedAmount - parsedFee).toFixed(2));
      await account.update({ balance: balanceAfter }, { transaction });
    } else if (type === TRANSACTION_TYPES.DEPOSIT) {
      balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));
      await account.update({ balance: balanceAfter, status: STATUS.ACTIVE }, { transaction });
    } else if (type === TRANSACTION_TYPES.TRANSFER) {
      if (account.status === STATUS.INACTIVE) {
        return commonHelper.customError('Account inactive, cannot proceed with transaction', 400);
      }

      if (!accountNo) return commonHelper.customError('Please write destination account no.', 400);
      if (accountNo === account.number) {
        return commonHelper.customError('Source and destination accounts cannot be the same', 409);
      }

      const toAccount = await UserAccount.findOne({ where: { number: accountNo } });
      if (!toAccount) return commonHelper.customError('Destination account not found', 400);

      if (balanceBefore < parsedAmount + parsedFee) {
        return commonHelper.customError('Insufficient funds for transfer', 409);
      }

      balanceAfter = parseFloat((balanceBefore - parsedAmount - parsedFee).toFixed(2));
      const toBalanceAfter = parseFloat((parseFloat(toAccount.balance) + parsedAmount).toFixed(2));

      await Promise.all([
        account.update({ balance: balanceAfter }, { transaction }),
        toAccount.update({ balance: toBalanceAfter, status: STATUS.ACTIVE }, { transaction }),
        Transaction.create(
          {
            account_id: toAccount.id,
            target_account_no: account.number,
            type,
            payment_method: paymentMethod,
            amount: parsedAmount,
            fee: parsedFee,
            balance_before: toAccount.balance,
            balance_after: toBalanceAfter,
            status: TRANSACTION_STATUS.COMPLETED,
          },
          { transaction }
        ),
      ]);
    }

    await userTransaction.update(
      { balance_before: balanceBefore, balance_after: balanceAfter, status: TRANSACTION_STATUS.COMPLETED },
      { transaction }
    );

    await transaction.commit();

    notificationHelper.transactionNotification(
      account.User.email,
      type,
      parsedAmount,
      balanceBefore,
      balanceAfter
    );

    if (type === TRANSACTION_TYPES.TRANSFER) {
      const toAccount = await UserAccount.findOne({ where: { number: accountNo }, include: { model: User } });
      notificationHelper.transactionNotification(
        toAccount.User.email,
        type,
        parsedAmount,
        parseFloat(toAccount.balance),
        parseFloat((parseFloat(toAccount.balance) + parsedAmount).toFixed(2))
      );
    }

    return `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} successful`;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// list transactions
async function index(payload) {
  const { accountId, query, user } = payload;
  const { page, limit } = query;
  const { id, roles } = user;
  const role = roles.includes(ROLES['102']) ? ROLES['102'] : ROLES['103'];

  const offset = (page - 1) * limit;

  const account = await UserAccount.findByPk(accountId);
  if (!account) {
    return commonHelper.customError('No account found', 404);
  }

  if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: id },
    });

    if (branch.id !== account.branch_id) {
      return commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }
  } else if (role === ROLES['103'] && account.user_id !== id) {
    return commonHelper.customError('Cannot access other customer transaction history', 403);
  }

  const transactions = await Transaction.findAndCountAll({
    where: { account_id: accountId },
    offset: offset,
    limit: limit,
    order: [['created_at', 'DESC']],
  });

  return {
    totalItems: transactions.count,
    totalPages: Math.ceil(transactions.count / limit),
    currentPage: page,
    transactions: transactions.rows,
  };
}

// list transactions by id
async function view(payload) {
  const { accountId, transactionId, user } = payload;
  const { id, roles } = user;
  const role = roles.includes(ROLES['102']) ? ROLES['102'] : ROLES['103'];

  const account = await UserAccount.findByPk(accountId);

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: id },
    });

    if (branch.id !== account.branch_id) {
      return commonHelper.customError("Cannot access other account's branch transaction history", 403);
    }
  } else if (role === ROLES['103'] && account.user_id !== id) {
    return commonHelper.customError('Cannot access other customer transaction history', 403);
  }

  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      account_id: accountId,
    },
  });

  if (!transaction) {
    return commonHelper.customError('Transaction not found', 404);
  }

  return transaction;
}

async function update(payload) {
  const { accountId, transactionId, user } = payload;
  const { id } = user;

  const account = await UserAccount.findOne({
    where: { id: accountId },
    include: { model: User },
  });

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  const branch = await Branch.findOne({
    where: { branch_manager_id: id },
  });

  if (branch.id !== account.branch_id) {
    return commonHelper.customError("Cannot access other account's branch transaction history", 403);
  }

  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      account_id: accountId,
    },
  });

  if (!transaction) {
    return commonHelper.customError('Transaction not found', 404);
  }

  if (transaction.status === TRANSACTION_STATUS.FAILED) {
    return commonHelper.customError('Transaction is already marked as failed', 400);
  }

  if (transaction.status !== TRANSACTION_STATUS.PENDING) {
    return commonHelper.customError('Only pending transactions can be marked as failed', 400);
  }

  await transaction.update({
    status: TRANSACTION_STATUS.FAILED,
  });

  notificationHelper.failedTransactionNotification(account.User.email, transaction.type, transaction.amount);

  return 'Transaction status updated to failed';
}

module.exports = { create, index, view, update };

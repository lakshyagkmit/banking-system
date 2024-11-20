const { User, Role, UserAccount, Branch, AccountPolicy, UserApplication, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const accountHelper = require('../helpers/accounts.helper');
const notificationHelper = require('../helpers/notifications.helper');
const constants = require('../constants/constants');

// Create a  new account for customer based on his application
async function create(payload, user) {
  const transaction = await sequelize.transaction();
  try {
    const { userId, type, nominee, branchIfscCode } = payload;
    const { role } = user;

    const customer = await User.findOne({
      where: { id: userId },
      include: {
        model: Role,
        attributes: ['code'],
      },
    });

    if (!customer || customer.Roles[0].code !== constants.ROLES['103']) {
      return commonHelper.customError('No user Found', 404);
    }

    const branch = await Branch.findOne({
      where: { ifsc_code: branchIfscCode },
    });

    if (!branch) {
      return commonHelper.customError('No branch Found.', 404);
    }

    const application = await UserApplication.findOne({
      where: {
        user_id: customer.id,
        branch_ifsc_code: branch.ifsc_code,
        type: constants.ACCOUNT_TYPES.SAVINGS || constants.ACCOUNT_TYPES.CURRENT,
      },
    });

    if (!application) {
      return commonHelper.customError('No application found, cannot create account to this user', 404);
    }

    const branchId = branch.id;

    if (role === constants.ROLES['102']) {
      const branch = await Branch.findOne({
        where: { user_id: user.id },
      });

      if (!branch || branch.id !== branchId) {
        return commonHelper.customError('Branch managers can only create accounts in their own branch.', 403);
      }
    }

    const existingAccount = await UserAccount.findOne({
      where: {
        user_id: userId,
        type,
      },
    });

    if (existingAccount) {
      return commonHelper.customError(
        'User already has an account of this type. Cannot create another.',
        409
      );
    }

    const policy = await AccountPolicy.findOne({
      where: {
        account_type: type,
      },
    });

    if (!policy) {
      return commonHelper.customError('Invalid type and subtype combination.', 409);
    }

    const accountNumber = accountHelper.generateAccountNumber();

    const newAccount = await UserAccount.create(
      {
        policy_id: policy.id,
        branch_id: branchId,
        user_id: userId,
        type,
        number: accountNumber,
        interest_rate: policy.interest_rate,
        nominee,
      },
      { transaction }
    );

    await application.destroy({ transaction });

    await notificationHelper.accountCreationNotification(customer.email, type, accountNumber);
    await transaction.commit();

    return newAccount;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List accounts
async function index(query, user) {
  const { page, limit } = query;
  const { role } = user;

  const offset = (page - 1) * limit;

  let accounts;
  if (role === constants.ROLES['101']) {
    accounts = await UserAccount.findAndCountAll({
      offset: offset,
      limit: limit,
    });
  } else if (role === constants.ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: user.id },
    });
    accounts = await UserAccount.findAndCountAll({
      where: { branch_id: branch.id },
      offset: offset,
      limit: limit,
    });
  } else if (user.role === constants.ROLES['103']) {
    accounts = await UserAccount.findAndCountAll({
      where: { user_id: user.id },
      offset: offset,
      limit: limit,
    });
  }

  if (!accounts.rows.length) {
    return commonHelper.customError('No accounts found', 404);
  }

  return {
    totalItems: accounts.count,
    totalPages: Math.ceil(accounts.count / limit),
    currentPage: page,
    rows: accounts.rows,
  };
}

// Get a account by id
async function view(id, user) {
  const accountId = id;
  const role = user.role;

  let account;
  if (role === constants.ROLES['103']) {
    account = await UserAccount.findOne({
      where: { id: accountId, user_id: user.id },
      include: {
        model: User,
      },
    });
  }

  if (role === constants.ROLES['101']) {
    account = UserAccount.findOne({
      where: { id: accountId },
      include: [
        {
          model: User,
        },
        {
          model: Branch,
        },
      ],
    });
  }

  if (role === constants.ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: user.id },
    });

    account = await UserAccount.findOne({
      where: {
        id: accountId,
        branch_id: branch.id,
      },
      include: [
        {
          model: User,
        },
        {
          model: Branch,
        },
      ],
    });
  }

  return account;
}

// Update account details by id
async function update(id, payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const accountId = id;

    const account = await UserAccount.findOne({
      where: { id: accountId },
    });

    if (!account) {
      return commonHelper.customError('Account not found', 404);
    }

    const branch = await Branch.findOne({
      where: { user_id: user.id },
    });

    if (account.branch_id !== branch.id) {
      return commonHelper.customError('You can only update accounts of customers in your branch', 403);
    }

    const updatedAccount = await account.update(payload, { transaction });
    await transaction.commit();

    return updatedAccount;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// soft delete account by id
async function remove(id, user) {
  const transaction = await sequelize.transaction();

  try {
    const account = await UserAccount.findOne({
      where: { id },
    });

    if (!account) {
      return commonHelper.customError('Account not found', 404);
    }

    const branch = await Branch.findOne({
      where: { user_id: user.id },
    });

    if (account.branch_id !== branch.id) {
      return commonHelper.customError('You can only delete accounts of customers in your branch', 403);
    }

    await account.destroy({ transaction });
    await transaction.commit();

    return;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create, index, view, update, remove };

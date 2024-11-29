const { User, Role, UserAccount, Branch, AccountPolicy, UserApplication, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const userHelper = require('../helpers/users.helper');
const accountHelper = require('../helpers/accounts.helper');
const notificationHelper = require('../helpers/notifications.helper');
const { ROLES } = require('../constants/constants');

// Create a  new account for customer based on his application
async function create(payload) {
  const { data, user } = payload;
  const { userId, type, nominee } = data;
  const transaction = await sequelize.transaction();
  try {
    const customer = await User.findOne({
      where: { id: userId },
      include: {
        model: Role,
        attributes: ['code'],
      },
    });

    if (!customer || !customer.Roles) {
      return commonHelper.customError('No user found with the specified ID.', 404);
    }

    const branchManager = await User.findOne({
      where: { id: user.id },
      include: [
        {
          model: Branch,
        },
      ],
    });

    if (!branchManager || !branchManager.Branch) {
      return commonHelper.customError('Branch manager is not authorized to create a branch.', 403);
    }

    const branchIfscCode = branchManager.Branch.ifsc_code;

    const application = await UserApplication.findOne({
      where: {
        user_id: customer.id,
        branch_ifsc_code: branchIfscCode,
        type,
      },
    });

    if (!application) {
      return commonHelper.customError(
        'No application found for the user in the specified branch or account type.',
        404
      );
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
      where: { account_type: type },
    });

    if (!policy) {
      return commonHelper.customError('Invalid account type provided.', 409);
    }

    const accountNumber = accountHelper.generateAccountNumber();

    const newAccount = await UserAccount.create(
      {
        policy_id: policy.id,
        branch_id: branchManager.Branch.id,
        user_id: userId,
        type,
        number: accountNumber,
        interest_rate: policy.interest_rate,
        nominee,
      },
      { transaction }
    );

    await application.destroy({ transaction });

    await transaction.commit();

    notificationHelper.accountCreationNotification(customer.email, type, accountNumber);

    return newAccount;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// list accounts based on role (Admin gets all, Branch Manager gets branch-specific, Customer gets their own)
async function index(payload) {
  const { query, user } = payload;
  const { page, limit, ifscCode } = query;
  const role = userHelper.getHighestRole(user.roles);
  const offset = (page - 1) * limit;

  let whereCondition = {};
  let include = [];

  if (role === ROLES['101']) {
    include = [
      {
        model: Branch,
        where: ifscCode ? { ifsc_code: ifscCode } : {},
        attributes: ['id', 'ifsc_code'],
      },
    ];
  } else if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: user.id },
    });
    whereCondition = { branch_id: branch.id };
  } else {
    whereCondition = { user_id: user.id };
  }

  const accounts = await UserAccount.findAndCountAll({
    where: whereCondition,
    include,
    offset: offset,
    limit: limit,
  });

  return {
    totalItems: accounts.count,
    totalPages: Math.ceil(accounts.count / limit),
    currentPage: page,
    accounts: accounts.rows,
  };
}

// Get an account by id
async function view(payload) {
  const { id, user } = payload;
  const accountId = id;
  const role = userHelper.getHighestRole(user.roles);

  let whereCondition = {};
  let include = [{ model: User }];

  if (role === ROLES['101']) {
    whereCondition = { id: accountId };
    include.push({ model: Branch });
  } else if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: user.id },
    });
    whereCondition = { id: accountId, branch_id: branch.id };
    include.push({ model: Branch });
  } else {
    whereCondition = { id: accountId, user_id: user.id };
  }

  const account = await UserAccount.findOne({
    where: whereCondition,
    include,
  });

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  return account;
}

// Update account details by id
async function update(payload) {
  const { id, data, user } = payload;
  const accountId = id;
  const role = userHelper.getHighestRole(user.roles);

  const account = await UserAccount.findOne({
    where: { id: accountId },
  });

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: user.id },
    });
    if (account.branch_id !== branch.id) {
      return commonHelper.customError('You can only update accounts of customers in your branch', 403);
    }
  }

  const updatedAccount = await account.update(data);

  return updatedAccount;
}

// Soft delete account by id
async function remove(payload) {
  const { id, user } = payload;
  const role = userHelper.getHighestRole(user.roles);

  const account = await UserAccount.findOne({
    where: { id },
  });

  if (!account) {
    return commonHelper.customError('Account not found', 404);
  }

  if (role === ROLES['102']) {
    const branch = await Branch.findOne({
      where: { branch_manager_id: user.id },
    });
    if (account.branch_id !== branch.id) {
      return commonHelper.customError('You can only delete accounts of customers in your branch', 403);
    }
  }

  await account.destroy();

  return;
}

module.exports = { create, index, view, update, remove };

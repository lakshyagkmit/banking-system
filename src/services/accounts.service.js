const { User, Role, Account, Branch, Policy, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const accountHelper = require('../helpers/accounts.helper');
const constants = require('../constants/constants');

// Create a  new account for customer based on his application
async function create(payload, user) {
  const transaction = await sequelize.transaction();
  try {
    const { userId, type, subtype, balance, interestRate, nominee, branchIfscCode } = payload;
    const { role } = user;

    const customer = await User.findOne({
      where: { id: userId },
      include: {
        model: Role,
        attributes: ['code'],
      },
    });

    if (!customer || customer.Roles[0].code !== constants.ROLES['103']) {
      commonHelper.customError('No user Found', 404);
    }

    const branch = await Branch.findOne({
      where: { ifsc_code: branchIfscCode },
    });

    if (!branch) {
      commonHelper.customError('No branch Found.', 404);
    }

    const branchId = branch.id;

    if (role === constants.ROLES['102']) {
      const branch = await Branch.findOne({
        where: { user_id: user.id },
      });

      if (!branch || branch.id !== branchId) {
        commonHelper.customError('Branch managers can only create accounts in their own branch.', 403);
      }
    }

    const existingAccount = await Account.findOne({
      where: {
        user_id: userId,
        type,
      },
    });

    if (existingAccount) {
      commonHelper.customError('User already has an account of this type. Cannot create another.', 409);
    }

    const policy = await Policy.findOne({
      where: {
        account_type: type,
        account_subtype: subtype,
      },
    });

    if (!policy) {
      commonHelper.customError('Invalid type and subtype combination.', 409);
    }

    const accountNumber = accountHelper.generateAccountNumber();

    const newAccount = await Account.create(
      {
        policy_id: policy.id,
        branch_id: branchId,
        user_id: userId,
        type,
        subtype,
        number: accountNumber,
        balance,
        interest_rate: interestRate,
        nominee,
      },
      { transaction }
    );

    await transaction.commit();
    return commonHelper.convertKeysToCamelCase(newAccount.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List accounts
async function list(query, user) {
  const { page, limit } = query;
  const { role } = user;

  const offset = (page - 1) * limit;

  let accounts;
  if (role === constants.ROLES['101']) {
    accounts = await Account.findAndCountAll({
      offset: offset,
      limit: limit,
    });
  } else if (role === constants.ROLES['102']) {
    const branch = await Branch.findOne({
      where: { user_id: user.id },
    });
    accounts = await Account.findAndCountAll({
      where: { branch_id: branch.id },
      offset: offset,
      limit: limit,
    });
  } else if (user.role === constants.ROLES['103']) {
    accounts = await Account.findAndCountAll({
      where: { user_id: user.id },
      offset: offset,
      limit: limit,
    });
  }

  if (!accounts.rows.length) {
    commonHelper.customError('No accounts found', 404);
  }

  const accountsData = accounts.rows.map(account => commonHelper.convertKeysToCamelCase(account.dataValues));

  return {
    totalItems: accounts.count,
    totalPages: Math.ceil(accounts.count / limit),
    currentPage: page,
    data: accountsData,
  };
}

// Get a account by id
async function listById(params, user) {
  const accountId = params.id;
  const role = user.role;

  let account;
  if (role === constants.ROLES['103']) {
    account = await Account.findOne({
      where: { id: accountId, user_id: user.id },
      include: {
        model: User,
      },
    });
  }

  if (role === constants.ROLES['101']) {
    account = Account.findOne({
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

    account = await Account.findOne({
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

  return commonHelper.convertKeysToCamelCase(account.dataValues);
}

module.exports = { create, list, listById };

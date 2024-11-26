const { User, UserAccount, Branch, UserApplication, UserLocker } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');
const notificationHelper = require('../helpers/notifications.helper');
const { STATUS, APPLICATION_TYPES } = require('../constants/constants');

// request for creation of new account in the bank
async function requestAccount(payload) {
  const { data, user } = payload;
  const { branchIfscCode, type, nomineeName } = data;
  const { id } = user;

  const account = await UserAccount.findOne({
    where: {
      user_id: id,
      type,
    },
  });

  if (account) {
    return commonHelper.customError('Account already exist', 409);
  }

  const branch = await Branch.findOne({
    where: { ifsc_code: branchIfscCode },
  });

  if (!branch) {
    return commonHelper.customError('No branch Found.', 404);
  }

  const [branchManager, customer] = await Promise.all([
    User.findByPk(branch.branch_manager_id),
    User.findByPk(id),
  ]);

  if (!branchManager || !customer) {
    return commonHelper.customError('User not found', 404);
  }

  const newRequest = await UserApplication.create({
    user_id: id,
    branch_ifsc_code: branchIfscCode,
    type: type,
    nominee_name: nomineeName,
  });

  notificationHelper.applicationRequestNotification(branchManager.email, customer.name, 'account');
  notificationHelper.applicationSuccessNotification(customer.email, 'account');

  return newRequest;
}

// request for locker in the bank
async function requestLocker(payload) {
  const { data, user } = payload;
  const { type } = data;
  const { id } = user;

  const account = await UserAccount.findOne({
    where: {
      user_id: id,
    },
  });

  if (!account) {
    return commonHelper.customError('Account does not exist, Cannot request for locker', 409);
  }

  const branch = await Branch.findByPk(account.branch_id);

  if (!branch) {
    return commonHelper.customError('No branch Found.', 404);
  }

  const locker = await UserLocker.findOne({
    where: {
      user_id: id,
      status: STATUS.ACTIVE,
    },
  });

  if (locker) {
    return commonHelper.customError('Locker already exist', 409);
  }

  const [branchManager, customer] = await Promise.all([
    User.findByPk(branch.branch_manager_id),
    User.findByPk(id),
  ]);

  if (!branchManager || !customer) {
    return commonHelper.customError('User not found', 404);
  }

  const newRequest = await UserApplication.create({
    user_id: id,
    branch_ifsc_code: branch.ifsc_code,
    type,
  });

  notificationHelper.applicationRequestNotification(branchManager.email, customer.name, 'locker');
  notificationHelper.applicationSuccessNotification(customer.email, 'locker');

  return newRequest;
}

// List applications
async function index(payload) {
  const { query, user } = payload;
  const { page, limit, requestType } = query;
  const offset = (page - 1) * limit;

  const branch = await Branch.findOne({
    where: {
      branch_manager_id: user.id,
    },
  });

  let whereCondition = {
    branch_ifsc_code: branch.ifsc_code,
  };

  if (requestType === 'accounts') {
    whereCondition.type = { [Op.ne]: APPLICATION_TYPES.LOCKER };
  } else if (requestType === 'lockers') {
    whereCondition.type = APPLICATION_TYPES.LOCKER;
  }

  const applications = await UserApplication.findAndCountAll({
    where: whereCondition,
    offset,
    limit,
    attributes: {
      exclude: requestType === 'accounts' ? [] : ['nominee_name'],
    },
  });

  if (!applications) {
    return commonHelper.customError('No applications found', 404);
  }

  return {
    totalItems: applications.count,
    totalPages: Math.ceil(applications.count / limit),
    currentPage: page,
    applications: applications.rows,
  };
}

// Get an application by id
async function view(payload) {
  const { id, user } = payload;

  const branch = await Branch.findOne({
    where: {
      branch_manager_id: user.id,
    },
  });

  const application = await UserApplication.findOne({
    where: {
      id,
      branch_ifsc_code: branch.ifsc_code,
    },
    include: [
      {
        model: User,
      },
    ],
  });

  if (!application) {
    return commonHelper.customError('Application not found', 404);
  }

  return application;
}

module.exports = { requestAccount, requestLocker, index, view };

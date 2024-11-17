const { User, Account, Branch, Application, UserLocker, sequelize } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');
const notificationHelper = require('../helpers/notifications.helper');

// request for creation of new account in the bank
async function requestAccount(payload, user) {
  const transaction = await sequelize.transaction();
  try {
    const { branchIfscCode, accountType, accountSubtype, nomineeName } = payload;
    const { id } = user;

    const account = await Account.findOne({
      where: {
        user_id: id,
        type: accountType,
      },
    });

    if (account) {
      commonHelper.customError('Account already exist', 409);
    }

    const branch = await Branch.findOne({
      where: { ifsc_code: branchIfscCode },
    });

    if (!branch) {
      commonHelper.customError('No branch Found.', 404);
    }

    const branchManager = await User.findOne({
      where: {
        id: branch.user_id,
      },
    });

    const customer = await User.findByPk(id);

    const newRequest = await Application.create(
      {
        user_id: id,
        branch_ifsc_code: branchIfscCode,
        account_type: accountType,
        account_subtype: accountSubtype,
        nominee_name: nomineeName,
      },
      { transaction }
    );

    await notificationHelper.applicationRequestNotification(branchManager.email, customer.name, 'account');
    await notificationHelper.applicationSuccessNotification(customer.email, 'account');

    await transaction.commit();
    return newRequest;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// request for locker in the bank
async function requestLocker(payload, user) {
  const transaction = await sequelize.transaction();
  try {
    const { lockerRequestDesc } = payload;
    const { id } = user;

    const account = await Account.findOne({
      where: {
        user_id: id,
      },
    });

    if (!account) {
      commonHelper.customError('Account does not exist, Cannot request for locker', 409);
    }

    const branch = await Branch.findByPk(account.branch_id);

    if (!branch) {
      commonHelper.customError('No branch Found.', 404);
    }

    const locker = await UserLocker.findOne({
      where: {
        user_id: id,
        status: 'active',
      },
    });

    if (locker) {
      commonHelper.customError('Locker already exist', 409);
    }

    const branchManager = await User.findOne({
      where: {
        id: branch.user_id,
      },
    });

    const customer = await User.findByPk(id);

    const newRequest = await Application.create(
      {
        user_id: id,
        branch_ifsc_code: branch.ifsc_code,
        locker_request_desc: lockerRequestDesc,
      },
      { transaction }
    );

    await notificationHelper.applicationRequestNotification(branchManager.email, customer.name, 'locker');
    await notificationHelper.applicationSuccessNotification(customer.email, 'locker');

    await transaction.commit();
    return newRequest;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List applications
async function list(query, user) {
  const { page, limit, requestType } = query;
  const offset = (page - 1) * limit;

  const branch = await Branch.findOne({
    where: {
      user_id: user.id,
    },
  });

  let whereCondition = {
    branch_ifsc_code: branch.ifsc_code,
  };

  if (requestType === 'accounts') {
    whereCondition.locker_request_desc = null;
  } else if (requestType === 'lockers') {
    whereCondition.locker_request_desc = { [Op.ne]: null };
  }

  const applications = await Application.findAndCountAll({
    where: whereCondition,
    offset,
    limit,
    attributes: {
      exclude:
        requestType === 'accounts'
          ? ['locker_request_desc']
          : ['account_type', 'account_subtype', 'nominee_name'],
    },
  });

  if (!applications.rows.length) {
    commonHelper.customError('No applications found', 404);
  }

  return {
    totalItems: applications.count,
    totalPages: Math.ceil(applications.count / limit),
    currentPage: page,
    data: applications.rows,
  };
}

// Get an application by id
async function listById(params, user) {
  const { id } = params;

  const branch = await Branch.findOne({
    where: {
      user_id: user.id,
    },
  });

  const application = await Application.findOne({
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
    commonHelper.customError('Application not found', 404);
  }

  return application;
}

module.exports = { requestAccount, requestLocker, list, listById };

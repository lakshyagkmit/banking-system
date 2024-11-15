const { Account, Branch, Application, UserLocker, sequelize } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');

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

    await transaction.commit();
    return commonHelper.convertKeysToCamelCase(newRequest.dataValues);
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

    const locker = await UserLocker.findOne({
      where: {
        user_id: id,
        status: 'active',
      },
    });

    if (locker) {
      commonHelper.customError('Locker already exist', 409);
    }

    const newRequest = await Application.create(
      {
        user_id: id,
        locker_request_desc: lockerRequestDesc,
      },
      { transaction }
    );

    await transaction.commit();
    return commonHelper.convertKeysToCamelCase(newRequest.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List applications
async function list(query) {
  const { page, limit, requesType } = query;

  const offset = (page - 1) * limit;

  let applications;
  if (requesType === 'accounts') {
    applications = await Application.findAndCountAll({
      where: {
        branch_ifsc_code: {
          [Op.ne]: null,
        },
      },
      offset: offset,
      limit: limit,
      attributes: {
        exclude: ['locker_request_desc'],
      },
    });
  } else if (requesType === 'lockers') {
    applications = await Application.findAndCountAll({
      where: {
        branch_ifsc_code: null,
      },
      offset: offset,
      limit: limit,
      attributes: {
        exclude: ['account_type', 'account_subtype', 'branch_ifsc_code', 'nominee_name'],
      },
    });
  } else {
    applications = await Application.findAndCountAll({
      offset: offset,
      limit: limit,
    });
  }

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
async function listById(params) {
  const { id } = params;

  const application = await Application.findOne({
    where: { id },
  });

  return application;
}

module.exports = { requestAccount, requestLocker, list, listById };

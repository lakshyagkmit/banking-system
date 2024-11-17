const { Application, Branch, Locker, User, Role, UserLocker, sequelize } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');
const notificationHelper = require('../helpers/notifications.helper');
const constants = require('../constants/constants');

// assign a locker to customer based on availability
async function assign(payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const { email, lockerSerialNo } = payload;
    const { id } = user;

    const customer = await User.findOne({
      where: { email },
      include: {
        model: Role,
        attributes: ['code'],
      },
    });

    if (!customer || customer.Roles[0].code !== constants.ROLES['103']) {
      commonHelper.customError('No user found', 404);
    }

    const branch = await Branch.findOne({
      where: {
        user_id: id,
      },
    });

    if (!branch.available_lockers) {
      commonHelper.customError('Locker not available', 400);
    }

    const application = await Application.findOne({
      where: {
        user_id: customer.id,
        branch_ifsc_code: branch.ifsc_code,
        locker_request_desc: {
          [Op.ne]: null,
        },
      },
    });

    if (!application) {
      commonHelper.customError('No application found, cannot assign a locker to this user', 409);
    }

    const locker = await Locker.findOne({
      where: {
        serial_no: lockerSerialNo,
      },
    });

    if (!locker || locker.status === 'freezed') {
      commonHelper.customError('This Locker is freezed', 409);
    }

    const userLocker = await UserLocker.findOne({
      where: {
        user_id: customer.id,
        status: 'active',
      },
    });

    if (userLocker) {
      commonHelper.customError('User can only have one locker at a time', 409);
    }

    await UserLocker.create(
      {
        locker_id: locker.id,
        user_id: customer.id,
        status: 'active',
      },
      { transaction }
    );

    await branch.update({ available_lockers: branch.available_lockers - 1 }, { transaction });

    await locker.update({ status: 'freezed' }, { transaction });

    await application.destroy({ transaction });

    await transaction.commit();

    await notificationHelper.lockerAssignedNotification(email, lockerSerialNo);

    return { message: 'Locker assigned successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// create bulk lockers in branch based on the total no. of lockers in the branch
async function create(payload, user) {
  const { numberOfLockers, monthlyCharge } = payload;
  const { id } = user;

  const branch = await Branch.findOne({
    where: { user_id: id },
  });

  const lockerCount = await Locker.count({
    where: { branch_id: branch.id },
  });

  if (lockerCount + numberOfLockers > branch.total_lockers) {
    commonHelper.customError('Cannot create lockers more than assigned total lockers in the branch', 409);
  }

  const lockers = [];
  for (let i = lockerCount; i < numberOfLockers; i++) {
    lockers.push({
      branch_id: branch.id,
      serial_no: i + 1,
      monthly_charge: monthlyCharge,
      status: 'available',
    });
  }

  await Locker.bulkCreate(lockers);
  return { message: `${numberOfLockers} lockers added successfully` };
}

// list lockers based on role
async function list(query, user) {
  const { page, limit } = query;
  const { id, role } = user;

  const offset = (page - 1) * limit;

  let lockers;
  if (role === constants.ROLES['103']) {
    lockers = await Locker.findAndCountAll({
      include: {
        model: User,
        where: { id },
        attributes: [],
      },
      offset: offset,
      limit: limit,
    });
  } else {
    const branch = await Branch.findOne({ where: { user_id: id } });
    lockers = await Locker.findAndCountAll({
      where: {
        branch_id: branch.id,
      },
      offset: offset,
      limit: limit,
    });
  }

  if (!lockers.rows.length) {
    commonHelper.customError('No lockers found', 404);
  }

  return {
    totalItems: lockers.count,
    totalPages: Math.ceil(lockers.count / limit),
    currentPage: page,
    data: lockers.rows,
  };
}

// list a locker by id
async function listById(id, user) {
  const branchManagerId = user.id;

  const branch = await Branch.findOne({ where: { user_id: branchManagerId } });

  const locker = await Locker.findOne({
    where: {
      id,
      branch_id: branch.id,
    },
  });

  if (!locker) {
    commonHelper.customError('Locker not found', 404);
  }

  return locker;
}

// update a locker
async function updateById(id, payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const branchManagerId = user.id;

    const branch = await Branch.findOne({
      where: { user_id: branchManagerId },
    });

    if (!branch) {
      throw commonHelper.customError('Branch not found', 404);
    }

    const locker = await Locker.findOne({
      where: {
        id,
        branch_id: branch.id,
      },
    });

    if (!locker) {
      throw commonHelper.customError('Locker not found', 404);
    }

    const data = commonHelper.convertKeysToSnakeCase(payload);

    await locker.update(data, { transaction });

    await transaction.commit();

    return { message: 'Locker updated successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// deallocate a locker from customer
async function deleteById(id, user) {
  const transaction = await sequelize.transaction();

  try {
    const branchManagerId = user.id;

    const branch = await Branch.findOne({
      where: { user_id: branchManagerId },
    });

    if (!branch) {
      throw commonHelper.customError('Branch not found', 404);
    }

    const locker = await Locker.findOne({
      where: {
        id,
        branch_id: branch.id,
      },
    });

    if (!locker) {
      throw commonHelper.customError('Locker not found', 404);
    }

    const userLocker = await UserLocker.findOne({
      where: {
        locker_id: locker.id,
        status: 'active',
      },
      transaction,
    });

    if (!userLocker || locker.status === 'available') {
      throw commonHelper.customError('Locker is not currently assigned', 400);
    }

    await locker.update({ status: 'available' }, { transaction });
    await userLocker.update({ status: 'inactive' }, { transaction });

    await transaction.commit();

    return { message: 'Locker deallocated successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { assign, create, list, listById, updateById, deleteById };

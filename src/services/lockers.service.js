const { UserApplication, Branch, Locker, User, Role, UserLocker, sequelize } = require('../models');
const commonHelper = require('../helpers/commonFunctions.helper');
const userHelper = require('../helpers/users.helper');
const notificationHelper = require('../helpers/notifications.helper');
const { ROLES, APPLICATION_TYPES, LOCKER_STATUS, STATUS } = require('../constants/constants');

// assign a locker to customer based on availability
async function assign(payload) {
  const { data, user } = payload;
  const { email, lockerSerialNo } = data;
  const { id } = user;

  const transaction = await sequelize.transaction();

  try {
    const customer = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          attributes: ['code'],
        },
      ],
    });

    const customerRoles = customer?.Roles?.map(role => role.code);

    if (!customerRoles.includes(ROLES['103'])) {
      return commonHelper.customError('No user found', 404);
    }

    const branch = await Branch.findOne({
      where: {
        branch_manager_id: id,
      },
    });

    if (!branch || !branch.total_lockers) {
      return commonHelper.customError('Locker not available', 400);
    }

    const application = await UserApplication.findOne({
      where: {
        user_id: customer.id,
        branch_ifsc_code: branch.ifsc_code,
        type: APPLICATION_TYPES.LOCKER,
      },
    });

    if (!application) {
      return commonHelper.customError('No application found, cannot assign a locker to this user', 409);
    }

    const locker = await Locker.findOne({
      where: {
        serial_no: lockerSerialNo,
        branch_id: branch.id,
      },
    });

    if (!locker || locker.status === 'freezed') {
      return commonHelper.customError('This Locker is freezed', 409);
    }

    const userLocker = await UserLocker.findOne({
      where: {
        user_id: customer.id,
        status: STATUS.ACTIVE,
      },
    });

    if (userLocker) {
      return commonHelper.customError('User can only have one locker at a time', 409);
    }

    await UserLocker.create(
      {
        locker_id: locker.id,
        user_id: customer.id,
        status: STATUS.ACTIVE,
      },
      { transaction }
    );

    await locker.update({ status: LOCKER_STATUS.FREEZED }, { transaction });
    await application.destroy({ transaction });
    await transaction.commit();
    notificationHelper.lockerAssignedNotification(email, lockerSerialNo);

    return;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// create bulk lockers in branch based on the total no. of lockers in the branch
async function create(payload) {
  const { data, user } = payload;
  const { numberOfLockers, monthlyCharge, branchIfscCode } = data;
  const { id, roles } = user;
  const userRole = userHelper.getHighestRole(roles);

  let whereCondition = {};
  if (userRole === ROLES['101']) {
    if (!branchIfscCode)
      return commonHelper.customError('please provide branch ifsc code to move forward', 400);
    whereCondition = { ifsc_code: branchIfscCode };
  } else {
    whereCondition = { branch_manager_id: id };
  }

  const branch = await Branch.findOne({
    where: whereCondition,
  });

  if (!branch) return commonHelper.customError('Branch not found', 404);

  const lockerCount = await Locker.count({
    where: { branch_id: branch.id },
  });

  if (lockerCount + numberOfLockers > branch.total_lockers) {
    return commonHelper.customError(
      'Cannot create lockers more than assigned total lockers in the branch',
      409
    );
  }

  const lockers = [];
  for (let i = lockerCount; i < lockerCount + numberOfLockers; i++) {
    lockers.push({
      branch_id: branch.id,
      serial_no: i + 1,
      monthly_charge: monthlyCharge,
      status: LOCKER_STATUS.AVAILABLE,
    });
  }

  await Locker.bulkCreate(lockers);
  return;
}

// list lockers based on role
async function index(payload) {
  const { query, user } = payload;
  const { page, limit, ifscCode } = query;
  const { id, roles } = user;
  const userRole = userHelper.getHighestRole(roles);
  const offset = (page - 1) * limit;

  let whereCondition = {};
  let include = [];

  if (userRole === ROLES['101']) {
    include = [
      {
        model: Branch,
        where: ifscCode ? { ifsc_code: ifscCode } : {},
        attributes: ['id', 'ifsc_code'],
      },
    ];
  } else if (userRole === ROLES['102']) {
    const branch = await Branch.findOne({ where: { branch_manager_id: id } });
    whereCondition = { branch_id: branch.id };
  } else {
    whereCondition = { status: LOCKER_STATUS.FREEZED };
    include = [{ model: User, where: { id }, attributes: ['id', 'name', 'email'] }];
  }

  const lockers = await Locker.findAndCountAll({
    where: whereCondition,
    include,
    offset: offset,
    limit: limit,
  });

  if (!lockers) {
    return commonHelper.customError('No lockers found', 404);
  }

  return {
    totalItems: lockers.count,
    totalPages: Math.ceil(lockers.count / limit),
    currentPage: page,
    lockers: lockers.rows,
  };
}

// view a locker by id based on role
async function view(payload) {
  const { id, user } = payload;
  const userRole = userHelper.getHighestRole(user.roles);

  let whereCondition = {};
  let include = {};

  if (userRole === ROLES['101']) {
    whereCondition = { id };
    include = { model: User };
  } else if (userRole === ROLES['102']) {
    const branch = await Branch.findOne({ where: { branch_manager_id: user.id } });
    whereCondition = { id, branch_id: branch.id };
    include = { model: User };
  } else {
    whereCondition = { id, status: LOCKER_STATUS.FREEZED };
    include = { model: User, where: { id: user.id } };
  }

  const locker = await Locker.findOne({
    where: whereCondition,
    include,
  });

  if (!locker) {
    return commonHelper.customError('Locker not found', 404);
  }

  return locker;
}

// update a locker (Admin and Branch Manager can update)
async function update(payload) {
  const { id, data, user } = payload;
  const { monthlyCharge } = data;
  const userRole = userHelper.getHighestRole(user.roles);

  const locker = await Locker.findOne({ where: { id } });
  if (!locker) return commonHelper.customError('Locker not found', 404);

  if (userRole === ROLES['102']) {
    const branch = await Branch.findOne({ where: { id: locker.branch_id, branch_manager_id: user.id } });
    if (!branch)
      return commonHelper.customError('Other Branch manager not authorised to update this locker', 403);
  }

  await locker.update({ monthly_charge: monthlyCharge });

  return;
}

// deallocate a locker from customer (Admin or Branch Manager can deallocate)
async function deallocate(payload) {
  const { id, user } = payload;
  const transaction = await sequelize.transaction();
  const userRole = userHelper.getHighestRole(user.roles);

  try {
    const locker = await Locker.findOne({ where: { id } });
    if (!locker) return commonHelper.customError('Locker not found', 404);

    if (userRole === ROLES['102']) {
      const branch = await Branch.findOne({ where: { id: locker.branch_id, branch_manager_id: user.id } });
      if (!branch)
        return commonHelper.customError('Other Branch manager not authorised to deallocate this locker', 403);
    }

    const userLocker = await UserLocker.findOne({
      where: { locker_id: locker.id, status: STATUS.ACTIVE },
      transaction,
    });

    if (!userLocker) return commonHelper.customError('Locker is not currently assigned', 400);

    await locker.update({ status: LOCKER_STATUS.AVAILABLE }, { transaction });
    await userLocker.update({ status: STATUS.INACTIVE }, { transaction });
    await transaction.commit();

    return { message: 'Locker deallocated successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { assign, create, index, view, update, deallocate };

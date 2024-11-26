const { User, Role, Branch, UserAccount, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const commonHelper = require('../helpers/commonFunctions.helper');
const awsHelper = require('../helpers/aws.helper');
const { ROLES } = require('../constants/constants');

// This function creates a new user with either a "Branch Manager" or
//"Customer" role, depending on the creator's role (Admin or not).
async function create(payload) {
  const { data, file, user } = payload;
  const {
    name,
    email,
    password,
    contact,
    govIssueIdType,
    fatherName,
    motherName,
    address,
    isVerified,
    roleCode,
  } = data;
  const { roles } = user;
  const role = roles.includes(ROLES['101']) ? ROLES['101'] : ROLES['102'];

  const transaction = await sequelize.transaction();

  try {
    if (role === ROLES['102'] && roleCode !== ROLES['103']) {
      throw commonHelper.customError('Branch managers can only create customers', 403);
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { contact }],
      },
      include: {
        model: Role,
        attributes: ['id', 'code'],
        through: { attributes: [] },
      },
    });

    if (existingUser) {
      const hasRole = existingUser.Roles.some(userRole => userRole.code === roleCode);

      if (hasRole) {
        return commonHelper.customError(
          `User with ${existingUser.email === email ? 'email' : 'contact'} already exists with the role ${roleCode}`,
          409
        );
      }

      const usersRole = await Role.findOne({
        where: { code: roleCode },
      });

      await existingUser.addRole(usersRole, { transaction });

      await transaction.commit();
      return existingUser;
    }

    if (!file) {
      return commonHelper.customError(`Please add government id image`, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const govIssueIdImageUrl = await awsHelper.uploadImageToS3(file);

    const newUser = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        contact,
        gov_issue_id_type: govIssueIdType,
        gov_issue_id_image: govIssueIdImageUrl,
        father_name: fatherName,
        mother_name: motherName,
        address,
        is_verified: isVerified,
      },
      { transaction }
    );

    const usersRole = await Role.findOne({
      where: { code: roleCode },
    });

    await newUser.addRole(usersRole, { transaction });

    await transaction.commit();

    return newUser;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List users (Branch Manager and Customer if Admin, only Customers if Branch Manager)
async function index(payload) {
  const { query, user } = payload;
  const { page = 1, limit = 10, userRole } = query;
  const { roles, id: userId } = user;
  const role = roles.includes(ROLES['101']) ? ROLES['101'] : ROLES['102'];

  const offset = (page - 1) * limit;
  let users;

  if (role === ROLES['101']) {
    const roles =
      userRole === ROLES['103']
        ? [ROLES['103']]
        : userRole === ROLES['102']
          ? [ROLES['102']]
          : [ROLES['102'], ROLES['103']];

    users = await User.findAndCountAll({
      distinct: true,
      include: [
        {
          model: Role,
          where: { code: roles },
          through: { attributes: [] },
        },
      ],
      offset,
      limit,
    });
  } else if (role === ROLES['102']) {
    const branch = await Branch.findOne({ where: { branch_manager_id: userId } });

    if (!branch) {
      return commonHelper.customError('No branch found', 404);
    }

    users = await User.findAndCountAll({
      distinct: true,
      include: [
        {
          model: Role,
          where: { code: [ROLES['103']] },
          through: { attributes: [] },
        },
        {
          model: UserAccount,
          where: {
            branch_id: branch.id,
          },
        },
      ],
      offset,
      limit,
    });
  }

  if (!users) {
    return commonHelper.customError('No users found', 404);
  }

  return {
    totalItems: users.count,
    totalPages: Math.ceil(users.count / limit),
    currentPage: page,
    users: users.rows,
  };
}

// View logged-in user's profile (unchanged)
async function viewMe(id) {
  const user = await User.findOne({
    where: { id },
    include: {
      model: Role,
      through: { attributes: [] },
    },
  });

  if (!user) {
    return commonHelper.customError('User not found', 404);
  }

  return user;
}

// View a specific user (Admins see all, Branch Managers see their customers)
async function view(payload) {
  const { id, user } = payload;
  const { roles, id: userId } = user;
  const role = roles.includes(ROLES['101']) ? ROLES['101'] : ROLES['102'];

  let userRecord;

  if (role === ROLES['101']) {
    userRecord = await User.findOne({
      where: { id },
      include: [
        {
          model: Role,
          where: { code: [ROLES['102'], ROLES['103']] },
          through: { attributes: [] },
        },
      ],
    });
  } else if (role === ROLES['102']) {
    const branch = await Branch.findOne({ where: { branch_manager_id: userId }, attributes: ['id'] });

    if (!branch) return commonHelper.customError('No branches managed by this user', 403);

    userRecord = await User.findOne({
      where: { id },
      include: [
        {
          model: Role,
          where: { code: [ROLES['103']] },
          through: { attributes: [] },
        },
        {
          model: UserAccount,
          where: {
            branch_id: branch.id,
          },
        },
      ],
    });
  }

  if (!userRecord) {
    return commonHelper.customError('User not found', 404);
  }

  return userRecord;
}

// Update a user (Admins can update any user, Branch Managers their customers)
async function update(payload) {
  const { id, data, user } = payload;
  const { name, email, contact, fatherName, motherName, address } = data;
  const { roles, id: userId } = user;
  const role = roles.includes(ROLES['101']) ? ROLES['101'] : ROLES['102'];

  const existingUser = await User.findOne({
    where: { [Op.or]: [{ email }, { contact }] },
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'contact';
    return commonHelper.customError(`This ${field} is already in use. Please use another ${field}.`, 409);
  }

  let whereCondition = {};
  const include = [
    {
      model: Role,
      through: { attributes: [] },
    },
  ];

  if (role === ROLES['102']) {
    const branch = await Branch.findOne({ where: { branch_manager_id: userId }, attributes: ['id'] });

    if (!branch) return commonHelper.customError('No branches managed by this user', 403);

    whereCondition = { branch_id: branch.id };
    include.push({
      model: UserAccount,
      where: whereCondition,
    });
  }

  const updateUser = await User.findOne({
    where: { id },
    include,
  });

  if (!updateUser) {
    return commonHelper.customError('User not found', 404);
  }

  const updatedUser = await updateUser.update({
    name,
    email,
    contact,
    father_name: fatherName,
    mother_name: motherName,
    address,
  });

  return updatedUser;
}

// Remove branch manager
async function removeManager(id) {
  const transaction = await sequelize.transaction();

  try {
    const deleteManager = await User.findOne({
      where: { id },
      include: [
        {
          model: Role,
          through: { attributes: [] },
        },
      ],
    });

    if (!deleteManager) {
      return commonHelper.customError('User not found', 404);
    }

    const isBranchManager = deleteManager.Roles.some(role => role.code === ROLES['102']);
    if (!isBranchManager) {
      return commonHelper.customError('User is not a branch manager', 400);
    }

    const isManagingBranch = await Branch.findOne({
      where: { branch_manager_id: id },
    });

    if (isManagingBranch) {
      return commonHelper.customError('Cannot delete a Branch Manager assigned to a branch', 409);
    }

    const managerRole = deleteManager.Roles.find(role => role.code === ROLES['102']);

    if (deleteManager.Roles.length > 1) {
      await deleteManager.removeRole(managerRole, { transaction });
    } else {
      await deleteManager.destroy({ transaction });
      await deleteManager.removeRole(managerRole, { transaction });
    }

    await transaction.commit();
    return { message: 'Branch manager removed successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// remove customer
async function removeCustomer(payload) {
  const { id, user } = payload;
  const { roles, id: userId } = user;
  const role = roles.includes(ROLES['101']) ? ROLES['101'] : ROLES['102'];

  const transaction = await sequelize.transaction();

  try {
    const include = [
      {
        model: Role,
        through: { attributes: [] },
      },
    ];

    let whereCondition = {};

    if (role === ROLES['102']) {
      const branch = await Branch.findOne({ where: { branch_manager_id: userId }, attributes: ['id'] });

      if (!branch) return commonHelper.customError('No branches managed by this user', 403);

      whereCondition = { branch_id: branch.id };
      include.push({
        model: UserAccount,
        where: whereCondition,
      });
    }

    const deleteCustomer = await User.findOne({
      where: { id },
      include,
    });

    if (!deleteCustomer) {
      return commonHelper.customError('Customer not found', 404);
    }

    if (deleteCustomer.UserAccounts && deleteCustomer.UserAccounts.length !== 0) {
      return commonHelper.customError('Cannot delete a customer with an active account', 409);
    }

    const customerRole = deleteCustomer.Roles.find(role => role.code === ROLES['103']);

    if (deleteCustomer.Roles.length > 1) {
      await deleteCustomer.removeRole(customerRole, { transaction });
    } else {
      await deleteCustomer.destroy({ transaction });
      await deleteCustomer.removeRole(customerRole, { transaction });
    }

    await transaction.commit();
    return { message: 'Customer removed successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create, index, view, viewMe, update, removeManager, removeCustomer };

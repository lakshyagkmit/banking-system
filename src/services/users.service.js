const { User, Role, UserRole, Branch, UserAccount, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const commonHelper = require('../helpers/commonFunctions.helper');
const awsHelper = require('../helpers/aws.helper');
const constants = require('../constants/constants');

// This function creates a new user with either a "Branch Manager" or
//"Customer" role, depending on the creator's role (Admin or not).
async function create(payload, file, user) {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, password, contact, govIssueIdType, fatherName, motherName, address, isVerified } =
      payload;
    const { role } = user;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { contact }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'contact';
      return commonHelper.customError(`User with ${field} exists, please use another ${field}`, 409);
    }

    if (!file) {
      return commonHelper.customError(`Please add gov_issue_id_image`, 409);
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
      where: { code: role === constants.ROLES['101'] ? constants.ROLES['102'] : constants.ROLES['103'] },
    });

    await UserRole.create(
      {
        user_id: newUser.id,
        role_id: usersRole.id,
      },
      { transaction }
    );
    await transaction.commit();

    return newUser;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List users (Branch Manager and Customer if Admin, only Customers if Branch Manager)
async function index(query, user) {
  const { page, limit, userRole } = query;
  const { role } = user;

  let roles;
  if (role === constants.ROLES['101'] && userRole === constants.ROLES['103']) {
    roles = [constants.ROLES['103']];
  } else if (role === constants.ROLES['101'] && userRole === constants.ROLES['102']) {
    roles = [constants.ROLES['102']];
  } else {
    if (role === constants.ROLES['101']) {
      roles = [constants.ROLES['102'], constants.ROLES['103']];
    } else {
      roles = [constants.ROLES['103']];
    }
  }

  const offset = (page - 1) * limit;

  const users = await User.findAndCountAll({
    include: {
      model: Role,
      where: { code: roles },
      through: { attributes: [] },
    },
    offset: offset,
    limit: limit,
  });

  if (!users.rows.length) {
    return commonHelper.customError('No users found', 404);
  }

  return {
    totalItems: users.count,
    totalPages: Math.ceil(users.count / limit),
    currentPage: page,
    rows: users.rows,
  };
}

// Get a user by ID with access control
async function view(id, user) {
  const { role } = user;

  let roles;
  if (user.id === id) {
    roles = [role];
  } else if (role === constants.ROLES['101']) {
    roles = [constants.ROLES['102'], constants.ROLES['103']];
  } else {
    roles = constants.ROLES['103'];
  }

  const users = await User.findOne({
    where: { id },
    include: {
      model: Role,
      where: { code: roles },
      through: { attributes: [] },
    },
  });

  return users;
}

// Update a user by ID with role-based access control
async function update(id, payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const { role } = user;

    const userToUpdate = await User.findOne({
      where: { id },
      include: {
        model: Role,
        through: { attributes: [] },
        attributes: ['code'],
      },
    });

    if (!userToUpdate) {
      return commonHelper.customError('User not found', 404);
    }

    const userRole = userToUpdate.Roles[0].code;

    if (
      role === constants.ROLES['101'] ||
      (role === constants.ROLES['102'] && userRole === constants.ROLES['103'])
    ) {
      const data = commonHelper.convertKeysToSnakeCase(payload);

      const updatedUser = await userToUpdate.update(data, { transaction });
      await transaction.commit();

      return updatedUser;
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Soft delete a user by ID with role-based access control
async function remove(id, user) {
  const transaction = await sequelize.transaction();
  try {
    const { role } = user;

    const userToDelete = await User.findByPk(id, {
      include: [
        {
          model: Role,
        },
        {
          model: Branch,
        },
        {
          model: UserAccount,
        },
      ],
    });

    if (!userToDelete) {
      return commonHelper.customError('User not found', 404);
    }

    const userRole = userToDelete.Roles[0].code;

    if (role === constants.ROLES['101'] && userRole === constants.ROLES['102'] && userToDelete.Branch) {
      return commonHelper.customError('Cannot delete a Branch Manager assigned to a branch', 409);
    }

    if (
      (role === constants.ROLES['101'] || role === constants.ROLES['102']) &&
      userRole === constants.ROLES['103'] &&
      userToDelete.Account
    ) {
      return commonHelper.customError('Cannot delete a customer with an active account', 409);
    }

    if (
      role === constants.ROLES['101'] ||
      (role === constants.ROLES['102'] && userRole === constants.ROLES['103'])
    ) {
      await userToDelete.destroy({ transaction });
      await UserRole.destroy(
        {
          where: {
            user_id: id,
          },
        },
        { transaction }
      );
    }

    await transaction.commit();
    return;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create, index, view, update, remove };

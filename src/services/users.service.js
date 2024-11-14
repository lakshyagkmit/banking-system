const { User, Role, UserRole, sequelize } = require('../models');
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
    const {
      name,
      email,
      password,
      contact,
      govIssueIdType,
      fatherName,
      motherName,
      address,
      emailVerified,
      isVerified,
    } = payload;
    const role = user.role;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { contact }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'contact';
      commonHelper.customError(`User with ${field} exists, please use another ${field}`, 409);
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
        email_verified: emailVerified,
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
    return commonHelper.convertKeysToCamelCase(newUser.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// List users (Branch Manager and Customer if Admin, only Customers if Branch Manager)
async function list(query, user) {
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
    commonHelper.customError('No users found', 404);
  }

  const usersData = users.rows.map(user => commonHelper.convertKeysToCamelCase(user.dataValues));

  return {
    totalItems: users.count,
    totalPages: Math.ceil(users.count / limit),
    currentPage: page,
    data: usersData,
  };
}

// Get a user by ID with access control
async function listById(params, user) {
  const { id } = params;
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

  return commonHelper.convertKeysToCamelCase(users.dataValues);
}

// Update a user by ID with role-based access control
async function updateById(params, payload, user) {
  const transaction = await sequelize.transaction();

  try {
    const { id } = params;
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
      commonHelper.customError('User not found', 404);
    }

    const userRole = userToUpdate.Roles[0].code;

    if (
      role === constants.ROLES['101'] ||
      (role === constants.ROLES['102'] && userRole === constants.ROLES['103'])
    ) {
      const data = commonHelper.convertKeysToSnakeCase(payload);

      const updatedUser = await userToUpdate.update(data, { transaction });
      await transaction.commit();
      return commonHelper.convertKeysToCamelCase(updatedUser.dataValues);
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Soft delete a user by ID with role-based access control
async function deleteById(id, user) {
  const transaction = await sequelize.transaction();
  try {
    const { role } = user;
    const userToDelete = await User.findByPk(id, {
      include: Role,
    });

    if (!userToDelete) {
      commonHelper.customError('User not found', 404);
    }

    const userRole = userToDelete.Roles[0].code;

    if (
      role === constants.ROLES['101'] ||
      (role === constants.ROLES['102'] && userRole === constants.ROLES['102'])
    ) {
      await userToDelete.destroy({ transaction });
      await transaction.commit();
      return;
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { create, list, listById, updateById, deleteById };

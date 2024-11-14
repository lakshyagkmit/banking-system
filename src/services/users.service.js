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
    const code = user.role;

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
      where: { code: code === constants.ROLES['101'] ? constants.ROLES['102'] : constants.ROLES['103'] },
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

module.exports = { create };

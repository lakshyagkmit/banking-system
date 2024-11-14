const { User, Role, UserRole, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const notificationHelper = require('../helpers/notifications.helper');
const commonHelper = require('../helpers/commonFunctions.helper');
const otpHelper = require('../helpers/otps.helper');
const jwtHelper = require('../helpers/jwt.helper');
const awsHelper = require('../helpers/aws.helper');

async function register(payload, file) {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, password, contact, govIssueIdType, fatherName, motherName, address } = payload;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { contact }] },
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
      },
      { transaction }
    );

    const usersRole = await Role.findOne({
      where: { name: 'Customer' },
    });

    await UserRole.create(
      {
        user_id: newUser.id,
        role_id: usersRole.id,
      },
      { transaction }
    );

    await transaction.commit();

    await notificationHelper.sendOtp(email);

    return commonHelper.convertKeysToCamelCase(newUser.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function verifyEmail(email, otp) {
  if (!(await otpHelper.verifyOtp(email, otp))) {
    commonHelper.customError('Invalid OTP', 400);
  }

  const user = await User.findOne({
    where: { email },
  });

  await user.update({
    email_verified: true,
  });

  otpHelper.deleteOtp(email);
  return;
}

async function login(email) {
  const user = await User.findOne({ where: { email, is_verified: true } });
  if (!user) {
    commonHelper.customError(`user with email ${email} not exists`, 404);
  }

  await notificationHelper.sendOtp(email);

  return user;
}

async function verifyOtp(email, otp) {
  if (!(await otpHelper.verifyOtp(email, otp))) {
    commonHelper.customError('Invalid OTP', 400);
  }

  const user = await User.findOne({
    where: { email },
    include: {
      model: Role,
      attributes: ['name'],
    },
  });

  otpHelper.deleteOtp(email);

  return await jwtHelper.generateToken({
    id: user.id,
    role: user.Roles[0].name,
  });
}

module.exports = { register, verifyEmail, login, verifyOtp };

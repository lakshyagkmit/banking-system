const { User, Role, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const notificationHelper = require('../helpers/notifications.helper');
const commonHelper = require('../helpers/commonFunctions.helper');
const otpHelper = require('../helpers/otps.helper');
const jwtHelper = require('../helpers/jwt.helper');
const awsHelper = require('../helpers/aws.helper');
const { ROLES } = require('../constants/constants');

/**
 * Registers a new user, assigns the 'Customer' role, uploads the govIssueId image,
 * and sends an OTP to the user's email for verification.
 */
async function register(payload) {
  const { data, file } = payload;
  const { name, email, password, contact, govIssueIdType, fatherName, motherName, address } = data;

  const transaction = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { contact }],
      },
      include: {
        model: Role,
        through: { attributes: [] },
      },
    });

    if (existingUser) {
      return commonHelper.customError(
        `User with ${existingUser.email === email ? 'email' : 'contact'} already exists`,
        409
      );
    }

    if (!file) {
      return commonHelper.customError(`Please add gov_issue_id_image`, 400);
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
      where: { code: ROLES['103'] },
    });

    await newUser.addRole(usersRole, { transaction });

    await transaction.commit();
    notificationHelper.sendOtp(email);

    return newUser;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Verifies the user's email using an OTP. Updates the user's email verification
 * status upon successful OTP validation.
 */
async function verifyEmail(payload) {
  const { data } = payload;
  const { email, otp } = data;

  if (!(await otpHelper.verifyOtp(email, otp))) {
    commonHelper.customError('Invalid OTP', 400);
  }

  const user = await User.findOne({
    where: { email },
  });

  await user.update({
    is_verified: true,
  });

  otpHelper.deleteOtp(email);
  return;
}

/**
 * Logs in a user by sending an OTP for verification. Checks that the user's
 * email is verified before allowing login.
 */
async function login(payload) {
  const { data } = payload;
  const { email } = data;

  const user = await User.findOne({ where: { email, is_verified: true } });
  if (!user) {
    commonHelper.customError(`User with email ${email} does not exist`, 404);
  }

  notificationHelper.sendOtp(email);

  return user;
}

/**
 * Verifies the user's OTP for login. Generates a JWT token on successful OTP verification
 * and includes the user's role in the token payload.
 */
async function verifyOtp(payload) {
  const { data } = payload;
  const { email, otp } = data;

  if (!(await otpHelper.verifyOtp(email, otp))) {
    throw commonHelper.customError('Invalid OTP', 400);
  }

  const user = await User.findOne({
    where: { email },
    include: {
      model: Role,
      attributes: ['code'],
    },
  });

  if (!user) {
    throw commonHelper.customError('User not found', 404);
  }

  otpHelper.deleteOtp(email);

  const roles = user.Roles.map(role => role.code);

  return await jwtHelper.generateToken({
    id: user.id,
    roles,
  });
}

//Resends the OTP to the user's email for verification.
async function resendOtp(payload) {
  const { data } = payload;
  const { email } = data;

  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    return commonHelper.customError('User not found', 404);
  }

  notificationHelper.sendOtp(email);
  return;
}

module.exports = { register, verifyEmail, login, verifyOtp, resendOtp };

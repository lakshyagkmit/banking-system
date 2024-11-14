const { User, Role, Branch, Bank, sequelize } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');

// create new branch and assign a branch manager to it
async function create(payload) {
  const transaction = await sequelize.transaction();

  try {
    const { userId, name, address, ifscCode, contact, totalLockers } = payload;

    const userWithRole = await User.findOne({
      where: { id: userId },
      include: {
        model: Role,
        where: { name: 'Branch Manager' },
        through: { attributes: [] },
      },
    });

    if (!userWithRole) {
      commonHelper.customError('The specified user is not authorized as a Branch Manager', 403);
    }

    const existingBranch = await Branch.findOne({
      where: {
        [Op.or]: [{ ifsc_code: ifscCode }, { contact }, { user_id: userId }],
      },
    });

    const duplicateFields = [
      { field: 'ifsc_code', value: ifscCode },
      { field: 'contact', value: contact },
      { field: 'user_id', value: userId },
    ];

    for (const { field, value } of duplicateFields) {
      if (existingBranch && existingBranch[field] === value) {
        commonHelper.customError(`Branch with the same ${field} already exists`, 409);
      }
    }

    const bank = await Bank.findOne();

    const newBranch = await Branch.create(
      {
        bank_id: bank.id,
        user_id: userId,
        name,
        address,
        ifsc_code: ifscCode,
        contact,
        total_lockers: totalLockers,
      },
      { transaction }
    );
    await transaction.commit();
    return commonHelper.convertKeysToCamelCase(newBranch.dataValues);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// get all branches;
async function list(query) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const branches = await Branch.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  if (!branches.rows.length) {
    commonHelper.customError('No branches found', 404);
  }

  const branchesData = branches.rows.map(branch => commonHelper.convertKeysToCamelCase(branch.dataValues));

  return {
    branches: branchesData,
    totalBranches: branches.count,
    currentPage: page,
    totalPages: Math.ceil(branches.count / limit),
  };
}

module.exports = { create, list };
const { User, Role, Branch, Bank } = require('../models');
const { Op } = require('sequelize');
const commonHelper = require('../helpers/commonFunctions.helper');
const { ROLES } = require('../constants/constants');

// create new branch and assign a branch manager to it
async function create(payload) {
  const { data } = payload;
  const { branchManagerId, address, ifscCode, contact, totalLockers } = data;

  const branchManager = await User.findOne({
    where: { id: branchManagerId },
    include: {
      model: Role,
      where: { code: ROLES['102'] },
      through: { attributes: [] },
    },
  });

  if (!branchManager) {
    return commonHelper.customError('The specified user is not authorized as a Branch Manager', 403);
  }
  const existingBranch = await Branch.findOne({
    where: {
      [Op.or]: [{ ifsc_code: ifscCode }, { contact }, { branch_manager_id: branchManagerId }],
    },
  });

  const duplicateFields = [
    { field: 'ifsc_code', value: ifscCode },
    { field: 'contact', value: contact },
    { field: 'branch_manager_id', value: branchManagerId },
  ];

  for (const { field, value } of duplicateFields) {
    if (existingBranch && existingBranch[field] === value) {
      return commonHelper.customError(`Branch with the same ${field} already exists`, 409);
    }
  }

  const bank = await Bank.findOne();

  const newBranch = await Branch.create({
    bank_id: bank.id,
    branch_manager_id: branchManagerId,
    address,
    ifsc_code: ifscCode,
    contact,
    total_lockers: totalLockers,
  });

  return newBranch;
}

// get all branches;
async function index(payload) {
  const { query } = payload;
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const branches = await Branch.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  if (!branches) {
    return commonHelper.customError('No branches found', 404);
  }

  return {
    branches: branches.rows,
    totalBranches: branches.count,
    currentPage: page,
    totalPages: Math.ceil(branches.count / limit),
  };
}

// get a branch by id
async function view(id) {
  const branch = await Branch.findByPk(id);
  if (!branch) {
    return commonHelper.customError('Branch not found', 404);
  }
  return branch;
}

// update a branch by id
async function update(payload) {
  const { id, data } = payload;
  const { branchManagerId, address, ifscCode, contact, totalLockers } = data;

  const branch = await Branch.findByPk(id);
  if (!branch) {
    return commonHelper.customError('Branch not found', 404);
  }

  if (branchManagerId) {
    const branchManager = await User.findOne({
      where: { id: branchManagerId },
      include: [
        {
          model: Role,
          where: { code: ROLES['102'] },
          through: { attributes: [] },
        },
        {
          model: Branch,
          where: { id: { [Op.ne]: id } },
          required: false,
        },
      ],
    });

    if (!branchManager) {
      return commonHelper.customError('The specified user is not authorized as a Branch Manager', 403);
    }

    if (branchManager.Branch) {
      return commonHelper.customError(
        'The specified Branch Manager is already assigned to another branch',
        409
      );
    }
  }

  if (ifscCode || contact) {
    const whereConditions = [];
    if (ifscCode) whereConditions.push({ ifsc_code: ifscCode });
    if (contact) whereConditions.push({ contact: contact });

    const duplicateBranch = await Branch.findOne({
      where: {
        [Op.or]: whereConditions,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateBranch) {
      return commonHelper.customError(
        'The specified IFSC code or contact is already in use by another branch',
        409
      );
    }
  }

  if (
    branch.branch_manager_id === branchManagerId ||
    branch.ifsc_code === ifscCode ||
    branch.contact === contact
  ) {
    return commonHelper.customError(
      'Cannot use same data for branch manager id or ifsc code or contact for updation',
      409
    );
  }

  const updatedBranch = await branch.update({
    branch_manager_id: branchManagerId || branch.branch_manager_id,
    address: address || branch.address,
    ifsc_code: ifscCode || branch.ifsc_code,
    contact: contact || branch.contact,
    total_lockers: totalLockers || branch.total_lockers,
  });

  return updatedBranch;
}

module.exports = { create, index, view, update };

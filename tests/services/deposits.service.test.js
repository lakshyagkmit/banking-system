const { create } = require('../../src/services/deposits.service');
const { User, UserAccount, Branch, AccountPolicy, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const constants = require('../../src/constants/constants');
const { faker } = require('@faker-js/faker');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/notifications.helper');
jest.mock('../../src/helpers/accounts.helper');
jest.mock('redis', () => {
  const mRedisClient = {
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(),
  };
  return {
    createClient: jest.fn(() => mRedisClient),
  };
});

describe('create deposit account', () => {
  let payload, user, transaction;

  beforeEach(() => {
    payload = {
      type: constants.ACCOUNT_TYPES.FIXED,
      nominee: faker.person.fullName(),
      principleAmount: faker.number.int({ min: 1000, max: 10000 }),
    };
    user = {
      id: faker.string.uuid(),
    };

    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  commonHelper.customError.mockImplementation((message, status) => {
    const err = new Error(message);
    err.statusCode = status;
    throw err;
  });

  it('should throw an error if principle amount is missing for fixed account', async () => {
    payload.principleAmount = null;

    await expect(create(payload, user)).rejects.toThrow('Please add principle amount to proceed further');
  });

  it('should throw an error if installment amount is missing for recurring account', async () => {
    payload.type = constants.ACCOUNT_TYPES.RECURRING;
    payload.installmentAmount = null;

    await expect(create(payload, user)).rejects.toThrow('Please add installment amount to proceed further');
  });

  it('should throw an error if no primary account is found', async () => {
    User.findByPk.mockResolvedValue({});
    UserAccount.findOne.mockResolvedValue(null);

    await expect(create(payload, user)).rejects.toThrow(
      'No primary account found for the user. Please create a primary account first.'
    );
    expect(UserAccount.findOne).toHaveBeenCalledWith({
      where: { user_id: user.id, status: 'active' },
    });
  });

  it('should throw an error if branch is not found', async () => {
    User.findByPk.mockResolvedValue({});
    UserAccount.findOne.mockResolvedValueOnce({ branch_id: faker.string.uuid() });
    Branch.findOne.mockResolvedValue(null);

    await expect(create(payload, user)).rejects.toThrow('Branch associated with the account is not found.');
    expect(Branch.findOne).toHaveBeenCalled();
  });

  it('should rollback the transaction on error', async () => {
    const error = new Error('Unexpected error');
    User.findByPk.mockRejectedValue(error);

    await expect(create(payload, user)).rejects.toThrow(error);
    expect(transaction.rollback).toHaveBeenCalled();
  });
});

const { create } = require('../../src/services/deposits.service');
const { User, UserAccount, Branch, AccountPolicy } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const accountHelper = require('../../src/helpers/accounts.helper');
const notificationHelper = require('../../src/helpers/notifications.helper');
const { ACCOUNT_TYPES } = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/accounts.helper');
jest.mock('../../src/helpers/notifications.helper');
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

describe('Deposit Account Controller - create', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should create a new deposit account successfully (Fixed Deposit)', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.FIXED,
        nominee: 'John Doe',
        principleAmount: 5000,
      },
      user: {
        id: 1,
      },
    };

    const mockAccount = {
      user_id: 1,
      branch_id: 101,
      status: 'active',
      User: { email: 'test@example.com' },
    };

    const mockBranch = { id: 101 };
    const mockPolicy = {
      id: 1,
      account_type: ACCOUNT_TYPES.FIXED,
      minimum_amount: 1000,
      interest_rate: 5,
      lock_in_period: 12,
    };
    const mockAccountNumber = '1234567890';

    // Mock all the necessary calls
    UserAccount.findOne
      .mockResolvedValueOnce(mockAccount) // Active account
      .mockResolvedValueOnce(null); // No duplicate account number
    Branch.findOne.mockResolvedValueOnce(mockBranch);
    AccountPolicy.findOne.mockResolvedValueOnce(mockPolicy);
    accountHelper.generateAccountNumber.mockReturnValue(mockAccountNumber);
    UserAccount.findOne.mockResolvedValueOnce(null);
    UserAccount.create.mockResolvedValueOnce({
      id: 1,
      type: ACCOUNT_TYPES.FIXED,
      number: mockAccountNumber,
      principle_amount: mockPayload.data.principleAmount,
    });
    notificationHelper.accountCreationNotification.mockImplementation(() => {});

    // Act
    const result = await create(mockPayload);
    // Assert
    expect(result).toEqual({
      id: 1,
      type: ACCOUNT_TYPES.FIXED,
      number: mockAccountNumber,
      principle_amount: mockPayload.data.principleAmount,
    });

    expect(UserAccount.findOne).toHaveBeenCalledWith();
    expect(Branch.findOne).toHaveBeenCalledWith({ where: { id: mockAccount.branch_id } });
    expect(AccountPolicy.findOne).toHaveBeenCalledWith({ where: { account_type: ACCOUNT_TYPES.FIXED } });
    expect(accountHelper.generateAccountNumber).toHaveBeenCalled();
    expect(notificationHelper.accountCreationNotification).toHaveBeenCalledWith(
      mockAccount.User.email,
      ACCOUNT_TYPES.FIXED,
      mockAccountNumber
    );
  });

  it('should return error if principle amount is missing for Fixed Deposit', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.FIXED,
        nominee: 'John Doe',
      },
      user: {
        id: 1,
      },
    };

    const result = await create(mockPayload);

    expect(result).toEqual(commonHelper.customError('Please add principle amount to proceed further', 400));
  });

  it('should return error if installment amount is missing for Recurring Deposit', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.RECURRING,
        nominee: 'John Doe',
      },
      user: {
        id: 1,
      },
    };

    const result = await create(mockPayload);

    expect(result).toEqual(commonHelper.customError('Please add installment amount to proceed further', 400));
  });

  it('should return error if no primary account is found for the user', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.RECURRING,
        nominee: 'John Doe',
        installmentAmount: 2000,
      },
      user: {
        id: 1,
      },
    };

    UserAccount.findOne.mockResolvedValueOnce(null);

    const result = await create(mockPayload);

    expect(result).toEqual(
      commonHelper.customError(
        'No primary account found for the user. Please create a primary account first.',
        400
      )
    );
  });

  it('should return error if the branch associated with the account is not found', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.RECURRING,
        nominee: 'John Doe',
        installmentAmount: 2000,
      },
      user: {
        id: 1,
      },
    };

    const mockAccount = {
      user_id: 1,
      branch_id: 101,
      status: 'active',
    };

    UserAccount.findOne.mockResolvedValue(mockAccount);
    Branch.findOne.mockResolvedValue(null);

    const result = await create(mockPayload);

    expect(result).toEqual(commonHelper.customError('Branch associated with the account is not found.', 404));
  });

  it('should return error if the account policy is invalid', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.RECURRING,
        nominee: 'John Doe',
        installmentAmount: 2000,
      },
      user: {
        id: 1,
      },
    };

    const mockAccount = {
      user_id: 1,
      branch_id: 101,
      status: 'active',
    };

    UserAccount.findOne.mockResolvedValue(mockAccount);
    Branch.findOne.mockResolvedValue({ id: 101 });
    AccountPolicy.findOne.mockResolvedValue(null);

    const result = await create(mockPayload);

    expect(result).toEqual(commonHelper.customError('Invalid type', 409));
  });

  it('should return error if provided amount is less than the defined minimum amount', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.FIXED,
        nominee: 'John Doe',
        principleAmount: 500,
      },
      user: {
        id: 1,
      },
    };

    const mockAccount = {
      user_id: 1,
      branch_id: 101,
      status: 'active',
    };

    const mockPolicy = { id: 1, minimum_amount: 1000 };

    UserAccount.findOne.mockResolvedValue(mockAccount);
    Branch.findOne.mockResolvedValue({ id: 101 });
    AccountPolicy.findOne.mockResolvedValue(mockPolicy);

    const result = await create(mockPayload);

    expect(result).toEqual(
      commonHelper.customError('Provided amount is less than defined minimum amount.', 409)
    );
  });

  it('should return error if generated account number already exists', async () => {
    const mockPayload = {
      data: {
        type: ACCOUNT_TYPES.FIXED,
        nominee: 'John Doe',
        principleAmount: 5000,
      },
      user: {
        id: 1,
      },
    };

    const mockAccount = {
      user_id: 1,
      branch_id: 101,
      status: 'active',
    };

    const mockPolicy = { id: 1, minimum_amount: 1000, lock_in_period: 12, interest_rate: 5 };

    accountHelper.generateAccountNumber.mockReturnValue('1234567890');
    UserAccount.findOne
      .mockResolvedValueOnce(mockAccount) // Active account exists
      .mockResolvedValueOnce({ id: 2 }); // Duplicate account number exists
    Branch.findOne.mockResolvedValueOnce({ id: 101 });
    AccountPolicy.findOne.mockResolvedValueOnce(mockPolicy);

    const result = await create(mockPayload);

    expect(result).toEqual(
      commonHelper.customError('Generated account number already exists. Please retry.', 409)
    );
  });
});

const { create, index, view, update, remove } = require('../../src/services/users.service');
const { User, Role, UserRole, Branch, UserAccount, sequelize } = require('../../src/models');
const commonHelper = require('../../src/helpers/commonFunctions.helper');
const awsHelper = require('../../src/helpers/aws.helper');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../src/constants/constants');
const redisClient = require('../../src/config/redis');

jest.mock('../../src/models');
jest.mock('../../src/helpers/commonFunctions.helper');
jest.mock('../../src/helpers/aws.helper');
jest.mock('bcryptjs');
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

describe('User Service Tests', () => {
  let fakeTransaction, fakeRole, fakeUser, fakeBranch, fakeAccount;

  beforeEach(() => {
    fakeTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(fakeTransaction);

    fakeRole = {
      id: 1,
      code: ROLES['103'],
    };

    fakeUser = {
      id: 1,
      name: 'John Doe',
      email: 'test@example.com',
      contact: '1234567890',
      update: jest.fn(),
      destroy: jest.fn(),
      Roles: [fakeRole],
    };

    fakeBranch = {
      id: 1,
      user_id: fakeUser.id,
    };

    fakeAccount = {
      id: 1,
      user_id: fakeUser.id,
    };

    commonHelper.customError.mockImplementation((message, status) => {
      const err = new Error(message);
      err.statusCode = status;
      throw err;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      User.findOne.mockResolvedValueOnce(null);
      Role.findOne.mockResolvedValueOnce(fakeRole);
      User.create.mockResolvedValueOnce(fakeUser);
      UserRole.create.mockResolvedValueOnce({});
      awsHelper.uploadImageToS3.mockResolvedValue('fake-image-url');
      bcrypt.hash.mockResolvedValue('hashed-password');

      const payload = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        contact: '1234567890',
        govIssueIdType: 'Passport',
        fatherName: 'Father Doe',
        motherName: 'Mother Doe',
        address: '123 Street',
        isVerified: true,
      };

      const file = { buffer: Buffer.from('fake-image') };
      const user = { role: ROLES['101'] };

      const result = await create(payload, file, user);

      expect(result).toEqual(fakeUser);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: payload.email }),
        expect.any(Object)
      );
      expect(UserRole.create).toHaveBeenCalled();
      expect(fakeTransaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if email or contact already exists', async () => {
      User.findOne.mockResolvedValue(fakeUser);

      const payload = { email: fakeUser.email, contact: fakeUser.contact };
      const file = {};
      const user = { role: ROLES['101'] };

      await expect(create(payload, file, user)).rejects.toThrow('User with email exists');
    });

    it('should throw an error if file is missing', async () => {
      User.findOne.mockResolvedValue(null);

      const payload = { email: 'new@example.com', contact: '1234567890' };
      const user = { role: ROLES['101'] };

      await expect(create(payload, null, user)).rejects.toThrow('Please add gov_issue_id_image');
    });
  });

  describe('index', () => {
    it('should return paginated users for Admin', async () => {
      User.findAndCountAll.mockResolvedValue({
        rows: [fakeUser],
        count: 1,
      });

      const query = { page: 1, limit: 10, userRole: ROLES['103'] };
      const user = { role: ROLES['101'] };

      const result = await index(query, user);

      expect(result).toEqual({
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        users: [fakeUser],
      });
      expect(User.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw an error if no users are found', async () => {
      User.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });

      const query = { page: 1, limit: 10, userRole: ROLES['103'] };
      const user = { role: ROLES['101'] };

      await expect(index(query, user)).rejects.toThrow('No users found');
    });
  });

  describe('view', () => {
    it('should return a user by ID', async () => {
      User.findOne.mockResolvedValue(fakeUser);

      const user = { role: ROLES['101'] };
      const result = await view(fakeUser.id, user);

      expect(result).toEqual(fakeUser);
      expect(User.findOne).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw an error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const user = { role: ROLES['101'] };
      await expect(view(fakeUser.id, user)).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update user details successfully', async () => {
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(fakeUser);

      fakeUser.update.mockResolvedValueOnce(fakeUser);

      const payload = { name: 'Jane Doe', email: 'jane@example.com', contact: '9876543210' };
      const user = { role: ROLES['101'] };

      const result = await update(fakeUser.id, payload, user);

      expect(result).toEqual(fakeUser);
      expect(fakeUser.update).toHaveBeenCalledWith(expect.objectContaining(payload), expect.any(Object));
      expect(fakeTransaction.commit).toHaveBeenCalled();
    });

    it('should throw an error if email or contact is already in use', async () => {
      User.findOne.mockResolvedValueOnce({ email: fakeUser.email }).mockResolvedValueOnce(fakeUser);

      const payload = { email: fakeUser.email };
      const user = { role: ROLES['101'] };

      await expect(update(fakeUser.id, payload, user)).rejects.toThrow('This email already occupied');
    });
  });
  describe('remove', () => {
    it('should throw an error if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const user = { role: ROLES['101'] };
      await expect(remove(fakeUser.id, user)).rejects.toThrow('User not found');
    });
  });
});

const otpHelper = require('../../src/helpers/otps.helper');
const redisClient = require('../../src/config/redis');
const { faker } = require('@faker-js/faker');

jest.mock('../../src/config/redis', () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
}));

describe('OTP Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = otpHelper.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });
  });

  describe('saveOtp', () => {
    it('should save OTP in Redis with expiry', async () => {
      const email = faker.internet.email();
      const otp = faker.string.numeric(6);

      redisClient.set.mockResolvedValue('OK');

      await otpHelper.saveOtp(email, otp);

      expect(redisClient.set).toHaveBeenCalledWith(`otp:${email}`, otp, 'EX', 60);
    });
  });

  describe('verifyOtp', () => {
    it('should return true if the stored OTP matches the input OTP', async () => {
      const email = faker.internet.email();
      const otp = faker.string.numeric(6);

      redisClient.get.mockResolvedValue(otp);

      const result = await otpHelper.verifyOtp(email, otp);
      expect(result).toBe(true);
      expect(redisClient.get).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should return false if the stored OTP does not match the input OTP', async () => {
      const email = faker.internet.email();
      const otp = faker.string.numeric(6);

      redisClient.get.mockResolvedValue('654321');

      const result = await otpHelper.verifyOtp(email, otp);
      expect(result).toBe(false);
      expect(redisClient.get).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should return false if no OTP is found in Redis', async () => {
      const email = faker.internet.email();
      const otp = faker.string.numeric(6);

      redisClient.get.mockResolvedValue(null);

      const result = await otpHelper.verifyOtp(email, otp);
      expect(result).toBe(false);
      expect(redisClient.get).toHaveBeenCalledWith(`otp:${email}`);
    });
  });

  describe('deleteOtp', () => {
    it('should delete the OTP from Redis', async () => {
      const email = faker.internet.email();

      redisClient.del.mockResolvedValue(1);

      await otpHelper.deleteOtp(email);

      expect(redisClient.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should handle cases where the OTP does not exist in Redis', async () => {
      const email = faker.internet.email();

      redisClient.del.mockResolvedValue(0);

      await otpHelper.deleteOtp(email);

      expect(redisClient.del).toHaveBeenCalledWith(`otp:${email}`);
    });
  });
});

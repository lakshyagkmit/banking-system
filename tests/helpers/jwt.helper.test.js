const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateToken, decryptJwt } = require('../../src/helpers/jwt.helper');
const commonhelper = require('../../src/helpers/commonFunctions.helper');

jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../../src/helpers/commonFunctions.helper');

describe('Token Utility Functions', () => {
  const mockPayload = { userId: 1 };
  const mockJwtSecret = 'mockSecret';
  const mockEncryptionKey = Buffer.from('mockEncryptionKeymockEncryptionKeymockE', 'utf8').toString('base64');
  const mockToken = 'mockJwtToken';
  const mockEncryptedToken = 'mockIv:mockEncryptedToken';
  const mockDecryptedToken = 'mockDecryptedToken';
  const mockIv = 'mockIv';
  const mockEncrypted = 'mockEncryptedToken';

  beforeEach(() => {
    process.env.JWT_SECRET = mockJwtSecret;
    process.env.ENCRYPTION_KEY = mockEncryptionKey;

    crypto.randomBytes.mockImplementation(size => Buffer.from(mockIv.substring(0, size), 'utf8'));
    jwt.sign.mockImplementation(() => mockToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate and encrypt a JWT', async () => {
      const cipherUpdateMock = jest.fn(() => 'encryptedPart1');
      const cipherFinalMock = jest.fn(() => 'encryptedPart2');

      crypto.createCipheriv.mockImplementation(() => ({
        update: cipherUpdateMock,
        final: cipherFinalMock,
      }));

      const result = await generateToken(mockPayload);

      expect(jwt.sign).toHaveBeenCalledWith(mockPayload, mockJwtSecret, { expiresIn: '1h' });
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(crypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-cbc',
        Buffer.from(mockEncryptionKey, 'base64'),
        Buffer.from(mockIv, 'utf8')
      );
      expect(cipherUpdateMock).toHaveBeenCalledWith(mockToken, 'utf8', 'hex');
      expect(cipherFinalMock).toHaveBeenCalled();
      expect(result).toBe(`6d6f636b4976:encryptedPart1encryptedPart2`);
    });
  });

  describe('decryptJwt', () => {
    it('should decrypt an encrypted JWT', () => {
      const decipherUpdateMock = jest.fn(() => mockToken);
      const decipherFinalMock = jest.fn(() => '');

      crypto.createDecipheriv.mockImplementation(() => ({
        update: decipherUpdateMock,
        final: decipherFinalMock,
      }));

      const result = decryptJwt(mockEncryptedToken);

      const [iv, encrypted] = mockEncryptedToken.split(':');

      expect(crypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-cbc',
        Buffer.from(mockEncryptionKey, 'base64'),
        Buffer.from(iv, 'hex')
      );
      expect(decipherUpdateMock).toHaveBeenCalledWith(encrypted, 'hex', 'utf8');
      expect(decipherFinalMock).toHaveBeenCalled();
      expect(result).toBe(mockToken);
    });
    it('should return an error for invalid token format', () => {
      const result = () => decryptJwt('invalidToken');
      expect(result).toThrow('Invalid token format.');
    });
  });
});

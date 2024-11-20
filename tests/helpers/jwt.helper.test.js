const jwtHelper = require('../../src/helpers/jwt.helper');
const jwt = require('jsonwebtoken');
const process = require('process');

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('generateToken', () => {
  const mockPayload = { userId: 123 };
  const mockToken = 'mocked.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'mockSecret';
  });

  it('should generate a token with the correct payload and secret', async () => {
    jwt.sign.mockReturnValue(mockToken);

    const result = await jwtHelper.generateToken(mockPayload);

    expect(jwt.sign).toHaveBeenCalledWith(mockPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    expect(result).toBe(mockToken);
  });

  it('should throw an error if there is an issue with generating the token', async () => {
    jwt.sign.mockImplementation(() => {
      throw new Error('JWT signing error');
    });

    await expect(jwtHelper.generateToken(mockPayload)).rejects.toThrow('JWT signing error');
  });
});

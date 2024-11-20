const accountHelper = require('../../src/helpers/accounts.helper');

describe('generateAccountNumber', () => {
  it('should generate an account number that starts with "2530012"', () => {
    const accountNumber = accountHelper.generateAccountNumber();
    expect(accountNumber.startsWith('2530012')).toBe(true);
  });

  it('should generate an account number of length 16', () => {
    const accountNumber = accountHelper.generateAccountNumber();
    expect(accountNumber.length).toBe(16);
  });

  it('should generate a unique account number each time', () => {
    const accountNumber1 = accountHelper.generateAccountNumber();
    const accountNumber2 = accountHelper.generateAccountNumber();
    expect(accountNumber1).not.toBe(accountNumber2);
  });

  it('should generate a valid account number with digits after the fixed part', () => {
    const accountNumber = accountHelper.generateAccountNumber();
    const randomPart = accountNumber.slice(7);
    expect(randomPart.length).toBe(9);
    expect(/^\d{9}$/.test(randomPart)).toBe(true);
  });
});

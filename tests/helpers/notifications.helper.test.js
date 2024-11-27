const emailHelper = require('../../src/helpers/notifications.helper');
const transporter = require('../../src/utils/email');
const otpHelper = require('../../src/helpers/otps.helper');
const { faker } = require('@faker-js/faker');
const constants = require('../../src/constants/constants');

jest.mock('../../src/utils/email', () => ({
  sendMail: jest.fn(),
}));

jest.mock('../../src/helpers/otps.helper', () => ({
  generateOtp: jest.fn(),
  saveOtp: jest.fn(),
}));

describe('Email Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMPT_MAIL = faker.internet.email();
  });

  describe('sendOtp', () => {
    it('should send an OTP email and save the OTP', async () => {
      const email = faker.internet.email();
      const mockOtp = faker.string.numeric(6);

      otpHelper.generateOtp.mockReturnValue(mockOtp);

      await emailHelper.sendOtp(email);

      expect(otpHelper.generateOtp).toHaveBeenCalled();
      expect(otpHelper.saveOtp).toHaveBeenCalledWith(email, mockOtp);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: 'Verification OTP',
        html: `<p>Your OTP code is ${mockOtp}. It will expire in 1 minute.</p>
          <p>Federal Bank</p>
        `,
      });
    });
  });

  describe('applicationRequestNotification', () => {
    it('should send an application request email', async () => {
      const email = faker.internet.email();
      const userName = faker.person.fullName(6);
      const applicationType = 'account';

      await emailHelper.applicationRequestNotification(email, userName, applicationType);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: `New ${applicationType} Request`,
        html: `
      <p>Dear Branch Manager,</p>
      <p>A new <strong>${applicationType}</strong> application has been submitted by <strong>${userName}</strong>.</p>
      <p>Please log in to the system to review the application.</p>
      <p>Thank you.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });

  describe('applicationSuccessNotification', () => {
    it('should send an application success email', async () => {
      const email = faker.internet.email();
      const applicationType = 'account';

      await emailHelper.applicationSuccessNotification(email, applicationType);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: `Your ${applicationType} Application is Submitted`,
        html: `
      <p>Dear User,</p>
      <p>We are pleased to inform you that your <strong>${applicationType}</strong> application has been successfully submitted.</p>
      <p>Our team will review your application and notify you of further updates.</p>
      <p>Thank you for choosing our services.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });

  describe('accountCreationNotification', () => {
    it('should send an account creation notification', async () => {
      const email = faker.internet.email();
      const accountType = constants.ACCOUNT_TYPES.SAVINGS;
      const accountNumber = '123456789';

      await emailHelper.accountCreationNotification(email, accountType, accountNumber);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: 'Your New Account is Created',
        html: `
      <p>Dear User,</p>
      <p>Congratulations! Your new <strong>${accountType}</strong> account has been successfully created.</p>
      <p>Your account number is <strong>${accountNumber}</strong>.</p>
      <p>Please deposit money within five days to activate it, otherwise it will be deactivated.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });

  describe('lockerAssignedNotification', () => {
    it('should send a locker assigned notification', async () => {
      const email = faker.internet.email();
      const lockerSerialNo = '1';

      await emailHelper.lockerAssignedNotification(email, lockerSerialNo);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: 'Locker Request Accepted',
        html: `
      <p>Dear User,</p>
      <p>Congratulations! Your locker request has been accepted.</p>
      <p>Your locker serial no is <storng>${lockerSerialNo}</strong>.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });

  describe('transactionNotification', () => {
    it('should send a transaction notification', async () => {
      const email = faker.internet.email();
      const transactionType = constants.TRANSACTION_TYPES.DEPOSIT;
      const amount = 5000;
      const balanceBefore = 10000;
      const balanceAfter = 15000;

      await emailHelper.transactionNotification(email, transactionType, amount, balanceBefore, balanceAfter);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: `Transaction Alert: ${transactionType}`,
        html: `
      <p>Dear User,</p>
      <p>A ${transactionType.toLowerCase()} of <strong>₹${amount}</strong> has been processed in your account.</p>
      <p>Your previous account balance was <strong>₹${balanceBefore}</strong>.</p?
      <p>Your updated account balance is <strong>₹${balanceAfter}</strong>.</p>
      <p>If you did not authorize this transaction, please contact us immediately.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });

  describe('failedTransactionNotification', () => {
    it('should send a failed transaction notification email', async () => {
      const email = faker.internet.email(); // Generate a fake email
      const transactionType = constants.TRANSACTION_TYPES.WITHDRAWAL; // Example transaction type
      const amount = 1000; // Example amount

      await emailHelper.failedTransactionNotification(email, transactionType, amount);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMPT_MAIL,
        to: email,
        subject: `Transaction Failed Alert: ${transactionType}`,
        html: `
      <p>Dear User,</p>
      <p>The transaction of type ${transactionType.toLowerCase()} of <strong>₹${amount}</strong> has been failed.</p>
      <p>Thank you for banking with us.</p>
      <p>Federal Bank</p>
    `,
      });
    });
  });
});

const awsHelper = require('../../src/helpers/aws.helper');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../src/utils/aws');
const process = require('process');

jest.mock('@aws-sdk/client-s3');
jest.mock('../../src/utils/aws');

describe('uploadImageToS3', () => {
  const mockFile = {
    buffer: Buffer.from('mock file data'),
    mimetype: 'image/png',
  };

  const mockS3Response = {
    ETag: '"mocketag123"',
  };

  const mockLocation = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Date.now()}_BANK`;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AWS_S3_BUCKET = 'mock-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  it('should successfully upload an image to S3 and return the image URL', async () => {
    s3Client.send.mockResolvedValue(mockS3Response);

    const result = await awsHelper.uploadImageToS3(mockFile);

    expect(result).toBeDefined();
    expect(result).toMatch(/^https:\/\/mock-bucket\.s3\.us-east-1\.amazonaws\.com/);
    expect(s3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if file upload fails', async () => {
    s3Client.send.mockRejectedValue(new Error('S3 upload error'));

    await expect(awsHelper.uploadImageToS3(mockFile)).rejects.toThrow('Failed to upload file to S3');
    expect(s3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(s3Client.send).toHaveBeenCalledTimes(1);
  });
});

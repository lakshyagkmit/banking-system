const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../utils/aws');
const process = require('process');

async function uploadImageToS3(file) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${Date.now()}_BANK`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const location = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return location;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to S3');
  }
}

module.exports = { uploadImageToS3 };

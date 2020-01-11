import { promisify } from 'util';
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import size from 's3-image-size';

AWS.config.update ({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'ap-northeast-2',
});

const bucket = process.env.S3_BUCKET || process.env.NODE_ENV === 'production' ? 'sparcs-kaist-zabo-dev' : 'sparcs-kaist-zabo-dev';

// TODO: Change key name
export const s3 = new AWS.S3 ();

export const photoUpload = multer ({
  storage: multerS3 ({
    s3,
    bucket: 'sparcs-kaist-zabo-dev',
    cacheControl: 'max-age=31536000',
    metadata: (req, file, cb) => {
      cb (null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb (null, Date.now ().toString ());
    },
  }),
});

/**
 *
 * @param {string} s3ImageKey - S3 Image Key
 * @return Promise
 */
export const sizeS3Item = promisify ((s3ImageKey, callback) => {
  size (s3, 'sparcs-kaist-zabo-dev', s3ImageKey, (err, dimensions, bytesRead) => {
    callback (err, [dimensions, bytesRead]);
  });
});

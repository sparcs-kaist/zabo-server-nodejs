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
const options = {
  s3,
  bucket,
  cacheControl: 'max-age=31536000',
  metadata: (req, file, cb) => {
    cb (null, { fieldName: file.fieldname });
  },
};

let zaboCount = 13642; // TODO: Date.now ()가 같은 값이 중복되는 문제가 있어서 임시로 카운터를 생성했음. 서버 확장성에 문제가 되므로 후에 제거.
export const zaboUpload = multer ({
  storage: multerS3 ({
    ...options,
    key: (req, file, cb) => {
      const filename = `${zaboCount}${Date.now ().toString ()}`;
      zaboCount += 1;
      const fullPath = `zabo/zabo-${filename}`;
      cb (null, fullPath);
    },
  }),
});

export const profileUpload = (type) => multer ({
  storage: multerS3 ({
    ...options,
    key: (req, file, cb) => {
      const filename = Date.now ().toString ();
      const fullPath = `profile/${type}-${filename}`;
      cb (null, fullPath);
    },
  }),
});
export const userProfileUpload = profileUpload ('user');
export const userBakupload = profileUpload ('user-bak');
export const groupProfileUpload = profileUpload ('group');
export const groupBakUpload = profileUpload ('group-bak');

/**
 *
 * @param {string} s3ImageKey - S3 Image Key
 * @return Promise
 */
export const sizeS3Item = promisify ((s3ImageKey, callback) => {
  size (s3, bucket, s3ImageKey, (err, dimensions, bytesRead) => {
    callback (err, [dimensions, bytesRead]);
  });
});

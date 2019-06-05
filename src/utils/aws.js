import multer from "multer"
import multerS3 from "multer-s3"
import aws from "aws-sdk"

aws.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	signatureVersion: 'v4',
	region: 'ap-northeast-2',
});

// TODO: Change key name
const s3 = new aws.S3();

const photoUpload = multer({
	storage: multerS3({
		s3: s3,
		bucket: 'sparcs-kaist-zabo-cookie',
		metadata: (req, file, cb) => {
			cb(null, {fieldName: file.fieldname});
		},
		key: (req, file, cb) => {
			cb(null, Date.now().toString());
		},
	}),
});

module.exports = { s3, photoUpload };

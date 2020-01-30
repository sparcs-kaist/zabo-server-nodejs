import express from 'express';
import * as uc from '../controllers/user';
import {
  findGroupMiddleware,
  authMiddleware as auth,
  isGroupMemberMiddleware,
} from '../middlewares';
import { userBakupload, userProfileUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const findGroupWithParams = (req, res, next) => {
  req.groupName = req.params.groupName;
  return findGroupMiddleware (req, res, next);
};

/* GET users listing. */
router.get ('/', auth, uc.getUserInfo);
router.post ('/', auth, uc.updateUserInfo);
router.post ('/profile', auth, userProfileUpload.single ('img'), uc.updateProfilePhoto);
router.post ('/background', auth, userBakupload.single ('img'), uc.updateBakPhoto);
router.post ('/currentGroup/:groupName', auth, findGroupWithParams, isGroupMemberMiddleware, uc.setCurrentGroup);

module.exports = router;

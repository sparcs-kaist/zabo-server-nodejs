import express from 'express';
import * as uc from '../controllers/user';
import {
  findGroup as fg,
  authMiddleware as auth,
  isGroupMember as gm,
} from '../middlewares';
import { userBakupload, userProfileUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const findGroup = (req, res, next) => {
  req.groupName = req.params.groupName;
  return fg (req, res, next);
};

/* GET users listing. */
router.get ('/', auth, uc.getUserInfo);
router.post ('/', auth, uc.updateUserInfo);
router.post ('/profile', auth, userProfileUpload.single ('img'), uc.updateProfilePhoto);
router.post ('/background', auth, userBakupload.single ('img'), uc.updateBakPhoto);
router.post ('/currentGroup/:groupName', auth, findGroup, gm, uc.setCurrentGroup);

module.exports = router;

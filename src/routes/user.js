import express from 'express';
import * as uc from '../controllers/user';
import {
  findSelfMiddleware,
  findGroupMiddleware,
  authMiddleware as auth,
  isGroupMemberMiddleware,
  findUserWithUsernameMiddleware,
  tryFindSelf,
} from '../middlewares';
import { userBakupload, userProfileUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const findGroupWithParams = (req, res, next) => {
  req.groupName = req.params.groupName;
  return findGroupMiddleware (req, res, next);
};

const findUserWithParams = (req, res, next) => {
  req.username = req.params.username;
  return findUserWithUsernameMiddleware (req, res, next);
};

/* GET users listing. */
router.get ('/', auth, uc.getUserInfo);
router.post ('/', auth, userProfileUpload.single ('img'), uc.updateUserInfo);
router.get ('/:username/pins', findUserWithParams, tryFindSelf, uc.listPins, uc.listNextPins);
router.post ('/background', auth, userBakupload.single ('img'), uc.updateBakPhoto);
router.post ('/currentGroup/:groupName', auth, findSelfMiddleware, findGroupWithParams, isGroupMemberMiddleware, uc.setCurrentGroup);

module.exports = router;

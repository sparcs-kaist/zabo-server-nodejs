import express from 'express';
import * as gc from '../controllers/group';
import {
  findGroup as fg,
  authMiddleware as auth,
  isGroupAdmin as ga,
  isGroupMember as gm,
  findUserWithUsername,
} from '../middlewares';
import { groupProfileUpload, groupBakUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const findGroup = (req, res, next) => {
  req.groupName = req.params.groupName;
  return fg (req, res, next);
};

// body validator
const findUser = (req, res, next) => {
  req.username = req.body.username;
  return findUserWithUsername (req, res, next);
};

const isGroupMember = [auth, findGroup, gm];
const isGroupAdmin = [auth, findGroup, ga, findUser];

router.get ('/:groupName', findGroup, gc.getGroupInfo);
router.post ('/:groupName', isGroupMember, gc.updateGroupInfo);
router.post ('/:groupName/profile', isGroupMember, groupProfileUpload.single ('img'), gc.updateProfilePhoto);
router.post ('/:groupName/background', isGroupMember, groupBakUpload.single ('img'), gc.updateBakPhoto);
router.put ('/:groupName/member', isGroupAdmin, gc.addMember);
router.post ('/:groupName/member', isGroupAdmin, gc.updateMember);
router.delete ('/:groupName/member', isGroupAdmin, gc.deleteMember);


module.exports = router;

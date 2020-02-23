import express from 'express';
import * as gc from '../controllers/group';
import {
  authMiddleware,
  findSelfMiddleware,
  findGroupMiddleware,
  isGroupAdminMiddleware,
  isGroupMemberMiddleware,
  findUserWithUserIdMiddleware,
  tryFindSelf,
} from '../middlewares';
import { groupProfileUpload, groupBakUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const findGroupWithParams = (req, res, next) => {
  req.groupName = req.params.groupName;
  return findGroupMiddleware (req, res, next);
};

// body validator
const findUserWithBody = (req, res, next) => {
  req.userId = req.body.userId;
  return findUserWithUserIdMiddleware (req, res, next);
};

const isGroupMember = [authMiddleware, findSelfMiddleware, findGroupWithParams, isGroupMemberMiddleware];
const isGroupAdmin = [authMiddleware, findSelfMiddleware, findGroupWithParams, isGroupAdminMiddleware, findUserWithBody];

router.get ('/recommends', gc.findGroupRecommends);
router.get ('/:groupName', findGroupWithParams, gc.getGroupInfo);
router.post ('/:groupName', isGroupMember, groupProfileUpload.single ('img'), gc.updateGroupInfo);
router.post ('/:groupName/background', isGroupMember, groupBakUpload.single ('img'), gc.updateBakPhoto);
router.put ('/:groupName/member', isGroupAdmin, gc.addMember);
router.post ('/:groupName/member', isGroupAdmin, gc.updateMember);
router.delete ('/:groupName/member', isGroupAdmin, gc.deleteMember);
router.get ('/:groupName/zabo/list', tryFindSelf, findGroupWithParams, gc.listGroupZabos, gc.listNextGroupZabos);

module.exports = router;

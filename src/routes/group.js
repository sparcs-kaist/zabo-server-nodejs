import express from 'express';
import * as gc from '../controllers/group';
import {
  findGroup, authMiddleware as auth, isGroupAdmin as ga, isGroupMember as gm,
} from '../middlewares';
import { profileUpload } from '../utils/aws';

const router = express.Router ();

// params validator
const pv = (req, res, next) => {
  req.groupName = req.params.groupName;
  return findGroup (req, res, next);
};

router.get ('/:groupName', pv, gc.getGroupInfo);
router.post ('/:groupName', pv, auth, gm, gc.updateGroupInfo);
router.post ('/:groupName/profile', pv, auth, gm, profileUpload ('group').single ('img'), gc.updateProfilePhoto);
router.post ('/:groupName/background', pv, auth, gm, profileUpload ('group-bak').single ('img'), gc.updateBakPhoto);
router.post ('/:groupName/member', pv, auth, ga, gc.updateMember);
router.put ('/:groupName/member', pv, auth, ga, gc.addMember);
router.delete ('/:groupName/member', pv, auth, ga, gc.deleteMember);


module.exports = router;

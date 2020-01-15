import express from 'express';
import * as groupControllers from '../controllers/group';
import { authMiddleware, isGroupAdmin } from '../middlewares';

const router = express.Router ();

router.get ('/:groupName', groupControllers.getGroupInfo);
router.post ('/:groupName', groupControllers.updatePhoto); // TODO: Update photo
router.post ('/:groupName/member', authMiddleware, isGroupAdmin, groupControllers.updateMember);
router.delete ('/:groupName/member', authMiddleware, isGroupAdmin, groupControllers.deleteMember);


module.exports = router;

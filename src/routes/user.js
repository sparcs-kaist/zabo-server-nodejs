import express from 'express';
import * as userControllers from '../controllers/user';
import { authMiddleware, isGroupMember } from '../middlewares';
import { profileUpload } from '../utils/aws';

const router = express.Router ();

/* GET users listing. */
router.get ('/', authMiddleware, userControllers.getUserInfo);
router.post ('/', authMiddleware, userControllers.updateUserInfo);
router.post ('/profile', profileUpload ('user').single ('img'), authMiddleware, userControllers.updateProfilePhoto);
router.post ('/currentGroup/:groupId', authMiddleware, isGroupMember, userControllers.setCurrentGroup);

module.exports = router;

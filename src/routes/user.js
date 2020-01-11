import express from 'express';
import * as userControllers from '../controllers/user';
import { authMiddleware, isGroupMember } from '../middlewares';

const router = express.Router ();

/* GET users listing. */
router.get ('/', authMiddleware, userControllers.getUserInfo);
router.post ('/currentGroup/:groupId', authMiddleware, isGroupMember, userControllers.setCurrentGroup);

module.exports = router;

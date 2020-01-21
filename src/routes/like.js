import express from 'express';
import * as lc from '../controllers/like';
import { authMiddleware } from '../middlewares';

const router = express.Router ();

// use '/zabo/like' api : user to like the zabo
// router.get('/usersNum', authMiddleware);
router.get ('/zabosNum', authMiddleware, lc.getLikeNum);

module.exports = router;

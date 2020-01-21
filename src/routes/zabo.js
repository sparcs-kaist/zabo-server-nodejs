import express from 'express';

import { authMiddleware, isZaboOwner, jwtParseMiddleware } from '../middlewares';
import { zaboUpload } from '../utils/aws';

import * as zc from '../controllers/zabo';

const router = express.Router ();

router.get ('/list', zc.listZabos, zc.listNextZabos);
router.post ('/pin', authMiddleware, zc.pinZabo);
router.delete ('/pin', authMiddleware, zc.deletePin);
router.post ('/like', authMiddleware, zc.likeZabo);
router.get ('/:zaboId', jwtParseMiddleware, zc.getZabo);
router.post ('/', authMiddleware, zaboUpload.array ('img', 20), zc.postNewZabo);
router.patch ('/:zaboId', authMiddleware, isZaboOwner, zc.editZabo);
router.delete ('/:zaboId', authMiddleware, zc.deleteZabo);

module.exports = router;

import express from 'express';

import { authMiddleware, isZaboOwner, jwtParseMiddleware } from '../middlewares';
import { zaboUpload } from '../utils/aws';

import * as zc from '../controllers/zabo';

const router = express.Router ();

router.get ('/', jwtParseMiddleware, zc.getZabo);
router.post ('/', authMiddleware, zaboUpload.array ('img', 20), zc.postNewZabo);
router.post ('/:zaboId/edit', authMiddleware, isZaboOwner, zc.editZabo);
router.delete ('/', authMiddleware, zc.deleteZabo);
router.get ('/list', zc.listZabos, zc.listNextZabos);
router.post ('/pin', authMiddleware, zc.pinZabo);
router.delete ('/pin', authMiddleware, zc.deletePin);

module.exports = router;

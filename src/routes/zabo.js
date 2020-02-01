import express from 'express';

import {
  jwtParseMiddleware,
  findSelfIfExist,
  authMiddleware,
  findSelfMiddleware,
  findZaboMiddleware,
  isZaboOwnerMiddleware,
} from '../middlewares';
import { zaboUpload } from '../utils/aws';

import * as zc from '../controllers/zabo';

const router = express.Router ();

const findZaboWithParams = (req, res, next) => {
  req.zaboId = req.params.zaboId;
  return findZaboMiddleware (req, res, next);
};

const findZaboWithAuth = [authMiddleware, findSelfMiddleware, findZaboWithParams];
const isZaboOwner = [authMiddleware, findSelfMiddleware, findZaboWithParams, isZaboOwnerMiddleware];
const tryFindSelf = [jwtParseMiddleware, findSelfIfExist];

router.get ('/list', tryFindSelf, zc.listZabos, zc.listNextZabos);
router.post ('/:zaboId/pin', findZaboWithAuth, zc.pinZabo);
router.post ('/:zaboId/like', findZaboWithAuth, zc.likeZabo);
router.get ('/:zaboId', tryFindSelf, zc.getZabo);
router.patch ('/:zaboId', isZaboOwner, zc.editZabo);
router.delete ('/:zaboId', isZaboOwner, zc.deleteZabo);
router.post ('/', authMiddleware, findSelfMiddleware, zaboUpload.array ('img', 20), zc.postNewZabo);

module.exports = router;

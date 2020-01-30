import express from 'express';
import * as profileController from '../controllers/profile';
import {
  authMiddleware,
  findSelfMiddleware,
  findProfileMiddleware,
} from '../middlewares';

const router = express.Router ();

const findProfile = (req, res, next) => {
  req.name = req.params.name;
  return findProfileMiddleware (req, res, next);
};

router.get ('/:name', findProfile, profileController.getProfile);
router.post ('/:name/follow', authMiddleware, findSelfMiddleware, findProfile, profileController.followController);

export default router;

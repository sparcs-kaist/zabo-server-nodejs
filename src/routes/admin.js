import express from 'express';
import * as adminControllers from '../controllers/admin';
import { authMiddleware, isAdmin, findUserWithStudentIdMiddleware } from '../middlewares';

const router = express.Router ();

const notInProduction = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') return res.status (403);
  next ();
};

const findUser = (req, res, next) => {
  req.studentId = req.params.studentId || req.body.studentId;
  return findUserWithStudentIdMiddleware (req, res, next);
};

router.use (authMiddleware, isAdmin);

router.get ('/user/:studentId', findUser, adminControllers.getUserInfo);
router.post ('/group', findUser, adminControllers.createGroup);

/* Temporary Routes */
router.post ('/fakeRegister', notInProduction, adminControllers.fakeRegister);
router.post ('/fakeLogin', adminControllers.fakeLogin);

/* For admin page */
router.get ('/analytics/zabo/date/created', adminControllers.analyticsGetZaboCreatedDate);
router.get ('/analytics/user/date/created', adminControllers.analyticsGetUserCreatedDate);


module.exports = router;

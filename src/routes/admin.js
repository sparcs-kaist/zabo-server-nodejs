import express from 'express';
import * as adminControllers from '../controllers/admin';
import { authMiddleware, isAdmin, findUserWithStudentIdMiddleware } from '../middlewares';

const router = express.Router ();

const findUser = (req, res, next) => {
  req.studentId = req.params.studentId || req.body.studentId;
  return findUserWithStudentIdMiddleware (req, res, next);
};

router.use (authMiddleware, isAdmin);

router.get ('/user/:studentId', findUser, adminControllers.getUserInfo);
router.post ('/group', findUser, adminControllers.createGroup);

/* Temporary Routes */
router.post ('/fakeRegister', adminControllers.fakeRegister);
router.post ('/fakeLogin', adminControllers.fakeLogin);

module.exports = router;

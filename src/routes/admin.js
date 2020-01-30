import express from 'express';
import * as adminControllers from '../controllers/admin';
import { authMiddleware, isAdmin, findUserWithStudentIdMiddleware } from '../middlewares';

const router = express.Router ();

const findUser = (req, res, next) => {
  req.studentId = req.params.studentId || req.body.studentId;
  return findUserWithStudentIdMiddleware (req, res, next);
};

router.get ('/user/:studentId', authMiddleware, isAdmin, findUser, adminControllers.getUserInfo);
router.post ('/group', authMiddleware, isAdmin, findUser, adminControllers.createGroup);

/* Temporary Routes */
router.post ('/fakeRegister', authMiddleware, isAdmin, adminControllers.fakeRegister);
router.post ('/fakeLogin', authMiddleware, isAdmin, adminControllers.fakeLogin);

module.exports = router;

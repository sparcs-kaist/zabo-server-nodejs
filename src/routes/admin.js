import express from 'express';
import * as adminControllers from '../controllers/admin';
import { authMiddleware as auth, isAdmin, findUserWithStudentId } from '../middlewares';

const router = express.Router ();

const findUser = (req, res, next) => {
  req.studentId = req.params.studentId || req.body.studentId;
  return findUserWithStudentId (req, res, next);
};

router.get ('/user/:studentId', auth, isAdmin, findUser, adminControllers.getUserInfo);
router.post ('/group', auth, isAdmin, findUser, adminControllers.createGroup);

/* Temporary Routes */
router.post ('/fakeRegister', auth, isAdmin, adminControllers.fakeRegister);
router.post ('/fakeLogin', auth, isAdmin, adminControllers.fakeLogin);

module.exports = router;

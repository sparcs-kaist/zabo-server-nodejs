import express from 'express';
import * as adminControllers from '../controllers/admin';
import { authMiddleware } from '../middlewares';

const router = express.Router ();

/* GET users listing. */
router.post ('/group', adminControllers.createGroup);
router.post ('/fakeRegister', adminControllers.fakeRegister);
router.post ('/fakeLogin', adminControllers.fakeLogin);
router.get ('/user/:studentId', adminControllers.getUserInfo);

module.exports = router;

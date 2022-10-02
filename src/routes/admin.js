import express from "express";
import * as ac from "../controllers/admin";
import {
  authMiddleware,
  isAdmin,
  findUserWithStudentIdMiddleware,
} from "../middlewares";

const router = express.Router();

const notInProduction = (req, res, next) => {
  if (process.env.NODE_ENV === "production") return res.status(403);
  next();
};

const findUser = (req, res, next) => {
  req.studentId = req.params.studentId || req.body.studentId;
  return findUserWithStudentIdMiddleware(req, res, next);
};

router.use(authMiddleware, isAdmin);

/* Temporary Routes */
router.post("/fakeRegister", notInProduction, ac.fakeRegister);
router.post("/fakeLogin", ac.fakeLogin);

/* For admin page */
router.get("/user/list", ac.listUsers);
router.get("/user/:studentId", findUser, ac.getUserInfo);
router.get("/group/list", ac.listGroups);
router.get("/group/applies", ac.listGroupApplies);
router.post("/group/apply/accept", ac.acceptGroupApply);
router.post("/group", findUser, ac.createGroup);
router.patch("/group/:groupName/level", ac.patchLevel);
router.get("/analytics/zabo/date/created", ac.analyticsGetZaboCreatedDate);
router.get("/analytics/user/date/created", ac.analyticsGetUserCreatedDate);

module.exports = router;

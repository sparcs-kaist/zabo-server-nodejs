import express from "express";
import * as profileController from "../controllers/profile";
import {
  authMiddleware,
  findSelfMiddleware,
  findProfileMiddleware,
  tryFindSelf,
} from "../middlewares";

const router = express.Router();

const findProfile = (req, res, next) => {
  req.name = req.params.name;
  return findProfileMiddleware(req, res, next);
};

router.get("/:name", tryFindSelf, findProfile, profileController.getProfile);
router.get("/:name/isValid", profileController.validateNameController);
router.post(
  "/:name/follow",
  authMiddleware,
  findSelfMiddleware,
  findProfile,
  profileController.followController,
);

export default router;

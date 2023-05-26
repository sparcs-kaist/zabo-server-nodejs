import express from "express";

import {
  authMiddleware,
  findSelfMiddleware,
  findZaboMiddleware,
  isZaboOwnerMiddleware,
  tryFindSelf,
  validateId,
  validateZaboId,
} from "../middlewares";
import { zaboUpload } from "../utils/aws";

import * as zc from "../controllers/zabo";

const router = express.Router();

const findZaboWithParams = (req, res, next) => {
  req.zaboId = req.params.zaboId;
  return findZaboMiddleware(req, res, next);
};

const findZaboWithAuth = [
  validateZaboId,
  authMiddleware,
  findSelfMiddleware,
  findZaboWithParams,
];
const isZaboOwner = [
  validateZaboId,
  authMiddleware,
  findSelfMiddleware,
  findZaboWithParams,
  isZaboOwnerMiddleware,
];

router.post(
  "/",
  authMiddleware,
  findSelfMiddleware,
  zaboUpload.array("img", 20),
  zc.postNewZabo,
);
router.get("/:zaboId", validateZaboId, tryFindSelf, zc.getZabo);
router.get(
  "/list",
  tryFindSelf,
  zc.listZabos,
  validateId("lastSeen"),
  zc.listNextZabos,
);
router.get("/list/hot", zc.listHotZabos);
router.get("/list/deadline", zc.listMagamImbakList);
router.patch("/:zaboId", isZaboOwner, zc.editZabo);
router.post("/:zaboId/pin", findZaboWithAuth, zc.pinZabo);
router.post("/:zaboId/like", findZaboWithAuth, zc.likeZabo);
router.post("/:zaboId/share", findZaboWithAuth, zc.shareZabo);
router.delete("/:zaboId", isZaboOwner, zc.deleteZabo);

module.exports = router;

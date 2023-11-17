import express from "express";

import {
  authMiddleware,
  findSelfMiddleware,
  findZaboMiddleware,
  isZaboOwnerMiddleware,
  tryFindSelf,
  validateId,
  validateZaboId,
  validateDeviceId,
  findDeviceMiddleware,
} from "../middlewares";
import { zaboUpload } from "../utils/aws";

import * as zc from "../controllers/zabo";

import { Device } from "../db";

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

router.get(
  "/list",
  tryFindSelf,
  zc.listZabos,
  validateId("lastSeen"),
  zc.listNextZabos,
);
router.get("/list/hot", zc.listHotZabos);
router.get("/list/deadline", zc.listMagamImbakList);
router.get(
  "/board",
  validateDeviceId,
  findDeviceMiddleware,
  zc.listZabosForBoard,
);

router.get("/deviceId", async (req, res) => {
  const { deviceId } = req.query;
  if (deviceId) {
    const device = await Device.findOne({ deviceId });

    if (device) {
      req.session.deviceId = deviceId;
      res.json({ message: "Device ID is set" });
    } else {
      res.status(400).json({ error: "Invalid Device ID" });
    }
  } else {
    res.status(400).json({ error: "Device ID is required" });
  }
});

router.post("/:zaboId/pin", findZaboWithAuth, zc.pinZabo);
router.post("/:zaboId/like", findZaboWithAuth, zc.likeZabo);
router.post("/:zaboId/share", findZaboWithAuth, zc.shareZabo);
router.get("/:zaboId", validateZaboId, tryFindSelf, zc.getZabo);
router.patch("/:zaboId", isZaboOwner, zc.editZabo);
router.delete("/:zaboId", isZaboOwner, zc.deleteZabo);
router.post(
  "/",
  authMiddleware,
  findSelfMiddleware,
  zaboUpload.array("img", 20),
  zc.postNewZabo,
);

module.exports = router;

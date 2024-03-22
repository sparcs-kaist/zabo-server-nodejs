import express from "express";
import { isAdmin, isDevice } from "../middlewares";
import * as bc from "../controllers/board";

const router = express.Router();

router.post("/device", isAdmin, bc.addDevice);
router.delete("/device", isAdmin, bc.removeDevice);
router.post("/login", bc.deviceLogin);
router.post("/logout", bc.deviceLogout);
router.get("/list", isDevice, bc.getDeviceZabos);

module.exports = router;

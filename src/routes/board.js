import express from "express";
import { isAdmin, isDevice } from "../middlewares";
import * as bc from "../controllers/board";

const router = express.Router();

router.post("/device", isAdmin, bc.addDevice);
router.delete("/device", isAdmin, bc.removeDevice);

module.exports = router;
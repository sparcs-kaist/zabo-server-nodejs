import express from "express";

import * as adminControllers from "../controllers/admin";
import { findSelfMiddleware, isAdmin } from "../middlewares";

const router = express.Router();

router.get("/", isAdmin, adminControllers.checkAdmin);

module.exports = router;

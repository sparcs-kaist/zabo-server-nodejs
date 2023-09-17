import express from "express";

import * as adminControllers from "../controllers/admin";
import { zaboUpload } from "../utils/aws";

const router = express.Router();

router.get("/", adminControllers.checkAdmin);
router.post("/zabo", zaboUpload.array("img", 20), adminControllers.postNewZabo);

module.exports = router;

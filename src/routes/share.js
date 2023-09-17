import express from "express";
import * as sc from "../controllers/share";

const router = express.Router();

router.get("/:zaboId", sc.shareZabo);

export default router;

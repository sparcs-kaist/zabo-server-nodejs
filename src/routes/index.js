import express from "express";
import adminRoutes from "./admin";
import authRoutes from "./auth";
import userRoutes from "./user";
import profileRoutes from "./profile";
import zaboRoutes from "./zabo";
import groupRoutes from "./group";
import searchRoutes from "./search";
import shareRoutes from "./share";
import { isAdmin, setCurrGroup2admin } from "../middlewares";

const router = express.Router();

router.use("/admin", isAdmin, setCurrGroup2admin, adminRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/profile", profileRoutes);
router.use("/zabo", zaboRoutes);
router.use("/group", groupRoutes);
router.use("/search", searchRoutes);
router.use("/s", shareRoutes);

module.exports = router;

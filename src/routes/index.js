import express from "express";
import adminRoutes from "./admin";
import authRoutes from "./auth";
import userRoutes from "./user";
import profileRoutes from "./profile";
import zaboRoutes from "./zabo";
import groupRoutes from "./group";
import searchRoutes from "./search";
import { isAdmin } from "../middlewares";

const router = express.Router();

router.use("/admin", isAdmin, adminRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/profile", profileRoutes);
router.use("/zabo", zaboRoutes);
router.use("/group", groupRoutes);
router.use("/search", searchRoutes);

module.exports = router;

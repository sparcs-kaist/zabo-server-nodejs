import express from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
import profileRoutes from "./profile";
import zaboRoutes from "./zabo";
import groupRoutes from "./group";
import searchRoutes from "./search";
import shareRoutes from "./share";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/profile", profileRoutes);
router.use("/zabo", zaboRoutes);
router.use("/group", groupRoutes);
router.use("/search", searchRoutes);
router.use("/s", shareRoutes);

module.exports = router;

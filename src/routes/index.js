import graphql from "../db/graphql"
import express from "express"
import authRoutes from "./auth"
import userRoutes from "./user"
import zaboRoutes from "./zabo"
import pinRoutes from "./pin"
import groupRoutes from "./group"
import adminRoutes from "./admin"
import searchRoutes from "./search"

const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' })
})

router.use('/graphql', graphql)
router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/zabo", zaboRoutes)
router.use("/pin", pinRoutes)
router.use("/group", groupRoutes)
router.use("/admin", adminRoutes)
router.use("/search", searchRoutes)

module.exports = router

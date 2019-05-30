import graphql from "../db/graphql"
import express from "express"
import authRoutes from "./auth"

const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' })
})

router.use('/graphql', graphql)
router.use("/auth", authRoutes)




module.exports = router

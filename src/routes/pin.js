import express from "express"
import * as pinControllers from "../controllers/pin"
import { authMiddleware } from "../middlewares"

const router = express.Router()

/* GET users listing. */
router.post('/', authMiddleware, pinControllers.createOrRemovePin)

module.exports = router

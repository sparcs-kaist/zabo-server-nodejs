import express from "express"
import * as pc from "../controllers/pin"
import { authMiddleware } from "../middlewares"

const router = express.Router()

/* GET users listing. */
// router.post('/', authMiddleware, pc.createOrRemovePin) // Replaced with /zabo/pin
router.get('/list', authMiddleware, pc.listPins, pc.listNextPins)

module.exports = router

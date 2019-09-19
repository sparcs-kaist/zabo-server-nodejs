import express from "express"

import { authMiddleware, jwtParseMiddleware } from "../middlewares"
import { photoUpload } from "../utils/aws"

import * as zc from "../controllers/zabo"

const router = express.Router()

router.get('/', jwtParseMiddleware, zc.getZabo)
router.post('/', authMiddleware, photoUpload.array("img", 20), zc.postNewZabo)
router.delete('/', authMiddleware, zc.deleteZabo)
router.get('/list', zc.listZabos, zc.listNextZabos)
router.post('/pin', authMiddleware, zc.pinZabo)
router.delete('/pin', authMiddleware, zc.deletePin)

module.exports = router

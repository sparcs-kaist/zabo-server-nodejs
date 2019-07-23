import express from "express"

import { authMiddleware } from "../middlewares"
import { photoUpload } from "../utils/aws"

import * as zaboControllers from "../controllers/zabo"

const router = express.Router()

router.get('/', zaboControllers.getZabo)
router.post('/', authMiddleware, photoUpload.array("img", 20), zaboControllers.postNewZabo)
router.delete('/', zaboControllers.deleteZabo)
router.get('/list', zaboControllers.listZabos)
router.get('/list/next', zaboControllers.listNextZabos)
router.post('/pin', authMiddleware, zaboControllers.pinZabo)
router.delete('/pin', authMiddleware, zaboControllers.deletePin)

module.exports = router

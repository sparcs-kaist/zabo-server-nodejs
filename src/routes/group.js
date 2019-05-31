import express from "express"
import * as groupControllers from "../controllers/group"
import { authMiddleware, isGroupAdmin } from "../middlewares"

const router = express.Router()

router.get("/:groupId", groupControllers.getGroupInfo)
router.post("/", groupControllers.updatePhoto) // TODO: Update photo
router.post('/:groupId/member', authMiddleware, isGroupAdmin, groupControllers.updateMember)
router.delete('/:groupId/member', authMiddleware, isGroupAdmin, groupControllers.deleteMember)


module.exports = router

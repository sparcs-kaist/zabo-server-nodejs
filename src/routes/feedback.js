import express from "express"
import { Feedback, User } from "../db"
import { logger } from "../utils/logger"
import { jwtParseMiddleware } from "../middlewares"

const router = new express.Router()

router.post('/', jwtParseMiddleware, async (req, res) => {
	try {
		const { feedback } = req.body
		logger.info("post /feedback/ request; feedback: %s", feedback)
		const data = {
			feedback
		}
		if (req.decoded) {
			const { sid } = req.decoded
			const user = await User.findOne({ sso_sid: sid })
			data.userId = user._id
		}
		const result = await Feedback.create(data)
		res.json(result)
	} catch (error) {
		logger.error(error)
		res.status(500).send({
			error: error.message
		})
	}
})

export default router

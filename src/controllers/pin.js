import mongoose from "mongoose"
import { Pin, User, Zabo } from "../db"
import { logger } from "../utils/logger"
import { isValidId } from "../utils"

/*
	This Controller is currently not being used
 */
export const createOrRemovePin = async (req, res) => {
	let { zaboId, boardId } = req.body
	if (
		!mongoose.Types.ObjectId.isValid(zaboId) ||
		!mongoose.Types.ObjectId.isValid(zaboId)
	) {
		console.error("Invalid object id", { zaboId, boardId })
		res.status(400).json({
			error: "Invalid object id",
		})
	}

	const { sid } = req.decoded
	if (!zaboId) {
		console.error("Zabo Id Not Given")
		res.status(400).json({
			error: "Zabo id not given",
		})
		return
	}

	try {
		if (!boardId) {
			const user = await User.findOne({ sso_sid: sid })
			boardId = user.boards[0]
		}

		const pin = await Pin.findOneAndRemove({
			pinnedBy: sid,
			boardId,
			zaboId,
		})

		if (pin) {
			await Zabo.findByIdAndUpdate(zaboId, {
				$pull: { pins: pin._id }
			})
		} else {
			const pin = await Pin.create({
				pinnedBy: sid,
				boardId,
				zaboId,
			})
			await Zabo.findByIdAndUpdate(zaboId, {
				$push: { pins: pin._id }
			})
		}
	} catch(error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

export const listPins = async (req, res, next) => {
	try {
		const { lastSeen } = req.query
		const { sid } = req.decoded
		if (lastSeen) return next()
		const user = await User.findOne({ sso_sid: sid })
		const pins = await Pin.find({ pinnedBy: user._id })
			.sort({ 'createdAt': -1 })
			.limit(30)
			.populate('zaboId')
		const zabos = pins.map(pin => pin.zaboId)
		res.send(zabos)
	} catch(error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

export const listNextPins = async (req, res) => {
	try {
		const { lastSeen } = req.query
		if (!isValidId(lastSeen)) {
			logger.error("get /pin/list/next request error; 400 - invalid lastSeen")
			return res.status(400).json({
				error: "invalid lastSeen"
			})
		}

		const { sid } = req.decoded
		const user = await User.findOne({ sso_sid: sid })
		const pins = await Pin.find({ pinnedBy: user._id, zaboId: { $lt: lastSeen } })
			.sort({ 'createdAt': -1 })
			.limit(30)
			.populate('zaboId')
		const zabos = pins.map(pin => pin.zaboId)
		res.send(zabos)
	} catch(error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

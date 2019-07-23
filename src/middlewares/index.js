import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { Group, User } from "../db"
import { isValidId } from "../utils"

export const authMiddleware = (req, res, next) => {
	const jwtSecret = req.app.get('jwt-secret')
	const token = (req.headers['authorization'] || "").substring(7)
	jwt.verify(token, jwtSecret, (err, decoded) => {
		if (err) {
			console.error(err.message)
			res.status(403).json({
				error: err.message
			})
			return
		}
		req.decoded = decoded
		req.token = token
		next()
	})
}

export const jwtParseMiddleware = (req, res, next) => {
	const jwtSecret = req.app.get('jwt-secret')
	const token = (req.headers['authorization'] || "").substring(7)
	jwt.verify(token, jwtSecret, (err, decoded) => {
		if (err) {
			next()
			return
		}
		req.decoded = decoded
		req.token = token
		next()
	})
}

export const isGroupAdmin = async (req, res, next) => {
	const { groupId } = req.params
	const { sid } = req.decoded

	if (!isValidId(groupId)) {
		console.error("Group Id is Invalid")
		res.status(400).json({
			error: "Group Id is Invalid"
		})
		return
	}

	try {
		const user = await User.findOne({ sso_sid: sid }, 'studentId')
		const group = await Group.findById(groupId, 'members')
		console.log({
			user,
			group
		})
		if (!group) {
			console.error("Group not found")
			res.status(404).json({
				error: "Group not found"
			})
			return
		}
		if (
			group.members.find(m => {
				return m.isAdmin && (m.studentId === user.studentId)
			})
		) {
			next()
		} else {
			res.status(403).json({
				error: "Not Group Admin"
			})
		}
	} catch (error) {
		console.error(error)
		res.sendStatus(500)
	}
}

export const isGroupMember = async (req, res, next) => {
	const { sid } = req.decoded
	const { groupId } = req.params

	if (!isValidId(groupId)) {
		console.error("Group Id is Invalid")
		res.status(400).json({
			error: "Group Id is Invalid"
		})
		return
	}

	try {
		const user = await User.findOne({ sso_sid: sid }, 'studentId')
		const group = await Group.findById(groupId, 'members')
		console.log({
			user,
			group
		})
		if (!group) {
			console.error("Group not found")
			res.status(404).json({
				error: "Group not found"
			})
			return
		}
		if (
			group.members.find(m => {
				return (m.studentId === user.studentId)
			})
		) {
			next()
		} else {
			res.status(403).json({
				error: "Not Group Member"
			})
		}
	} catch (error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

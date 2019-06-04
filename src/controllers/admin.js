import { Board, Group, User } from "../db"
import jwt from "jsonwebtoken"

export const createGroup = async (req, res) => {
	const { name, ownerStudentId } = req.body

	try {
		const user = await User.findOne({ studentId: ownerStudentId })
		if (!user) {
			console.error("User with studentId not found")
			res.status(404).json({
				error: "User with studentId not found"
			})
			return
		}

		const group = await Group.create({
			name,
			members: [{
				studentId: ownerStudentId,
				isAdmin: true
			}]
		})

		const newUser = await User.findOneAndUpdate({ studentId: ownerStudentId }, {
			$push: {
				groups: group._id
			}
		}, {
			new: true
		})
		console.log(newUser)
		res.json(group)
	} catch (error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

export const getUserInfo = async (req, res) => {
	const { studentId } = req.params
	try {
		const user = await User.findOne({ studentId })
			.populate('currentGroup', '_id name profilePhoto')
			.populate('groups', '_id name profilePhoto')
			.populate('boards', '_id title isPrivate')
		res.json(user)
	} catch(error) {
		console.error(error)
		res.status(404).json({
			error: error.message
		})
	}
}

export const fakeRegister = async (req, res) => {
	const { studentId } = req.body
	try {
		const board = await Board.create({
			title: "저장한 포스터"
		})
		const boards = [board._id]
		const user = await User.create({
			sso_uid: studentId,
			sso_sid: studentId,
			studentId,
			email: `${studentId}@kaist.ac.kr`,
			boards
		})
		res.json(user)
	} catch(error) {
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

export const fakeLogin = async (req, res) => {
	const { studentId } = req.body
	const jwtSecret = req.app.get('jwt-secret')
	const user = await User.findOne({ studentId })

	console.log({
		sid: user.sso_sid,
		email: user.email,
		studentId: user.studentId,
	})

	const token = jwt.sign({
		sid: user.sso_sid,
		email: user.email,
		studentId: user.studentId,
	}, jwtSecret, {
		expiresIn: "60d",
		issuer: "zabo-sparcs-kaist",
	})

	res.json(token)
}

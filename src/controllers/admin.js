import { Board, Group, User, Zabo } from "../db"
import jwt from "jsonwebtoken"
import { logger } from "../utils/logger";

// post /admin/group
export const createGroup = async (req, res) => {
	try {
		const { name, ownerStudentId } = req.body
		logger.api.info("post /admin/group request; name: %s, ownerStudentId: %s", name, ownerStudentId);

		if (!name || !ownerStudentId) {
			logger.api.error("post /admin/group request error; 400");
			return res.status(400).json({
				error: "bad request: null input",
			});
		}

		const user = await User.findOne({ studentId: ownerStudentId })
		if (!user) {
			logger.api.error("post /admin/group request error; 404 - user does not exist");
			res.status(404).json({
				error: "not found: user does not exist"
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
		logger.api.error(error)
		res.status(500).json({
			error: error.message
		})
	}
}

// get /admin/user/:studentId
export const getUserInfo = async (req, res) => {
	try {
		const { studentId } = req.params
		logger.api.info("get /admin/user/:studentId request; studentId: %s", studentId);
		const user = await User.findOne({ studentId })
			.populate('currentGroup', '_id name profilePhoto')
			.populate('groups', '_id name profilePhoto')
			.populate('boards', '_id title isPrivate')
		res.json(user)
	} catch(error) {
		logger.api.error(error)
		res.status(500).json({
			error: error.message
		})
	}
}

// post /admin/fakeRegister
export const fakeRegister = async (req, res) => {
	try {
		const { studentId } = req.body
		logger.api.info("post /admin/fakeRegister request; studentId: %s", studentId);
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
		logger.api.error(error)
		res.status(500).json({
			error: error.message
		})
	}
}

// post /admin/fakeLogin
export const fakeLogin = async (req, res) => {
	try {
		const { studentId } = req.body
		const jwtSecret = req.app.get('jwt-secret')
		const user = await User.findOne({ studentId })

		logger.api.info("post /admin/fakeLogin request; sid: %s, email: %s, studentId: %s", user.sso_sid, user.email, user.studentId);

		const token = jwt.sign({
			id: user._id,
			sid: user.sso_sid,
			email: user.email,
			studentId: user.studentId,
		}, jwtSecret, {
			expiresIn: "60d",
			issuer: "zabo-sparcs-kaist",
		})

		res.json(token)
	} catch (error) {
		logger.api.error(error)
		return res.status(500).json({
			error: error.message,
		});
	}

}


/* For admin page */
// get /analytics/zabo/date/created
export const analyticsGetZaboCreatedDate = async (req, res) => {
	try {
		logger.api.info("get /analytics/zabo/date/created")
		const zabos = [];

		// Use stream
		const cursor = await Zabo.find({}).lean().cursor();
		cursor.on('data', (zabo) => { zabos.push(zabo.createdAt) });
		cursor.on('end', () => {
			res.send(zabos);
		});
	} catch(error) {
		logger.api.error(error);
		res.status(500).json({
			error: error.message
		})
	}
}

// get /analytics/user/date/created
export const analyticsGetUserCreatedDate = async (req, res) => {
	try {
		logger.api.info("get /analytics/user/date/created")
		const users = [];

		// Use stream
		const cursor = await User.find({}).lean().cursor();
		cursor.on('data', (user) => { users.push(user.createdAt) });
		cursor.on('end', () => {
			res.send(users);
		});
	} catch(error) {
		logger.api.error(error);
		res.status(500).json({
			error: error.message
		})
	}
}
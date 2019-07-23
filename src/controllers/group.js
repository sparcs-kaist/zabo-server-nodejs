import { Group, User } from "../db"
import logger from "../utils/logger";

// get /group/:groupId
export const getGroupInfo = async (req, res) => {
	try {
		const { groupId } = req.params
		logger.api.info("get /group/:groupId request; groupId: %s", groupId);

		if (!groupId) {
			logger.api.error("get /group/:groupId request error; 400 - null groupId");
			return res.status(400).json({
				error: "bad request: null groupId",
			});
		}

		const group = await Group.findById(groupId)
		res.json(group)
	} catch(error) {
		logger.api.error(error)
		res.status(500).json({
			error: error.message
		});
	}
}

// post /group/:groupId
export const updatePhoto = async (req, res) => {
	try {
		const { groupId } = req.params
		logger.api.info("post /group/:groupId request; groupId: %s", groupId);

		if (!groupId) {
			logger.api.error("post /group/:groupId request error; 400 - null groupId");
			return res.status(400).json({
				error: "bad request: null groupId",
			});
		}

		res.json('todo')

	} catch (error) {
		logger.api.error(error)
		return res.status(500).json({
			error: error.message,
		})
	}
}

/**
 * Add user as a member if not exist,
 * update isAdmin if already a member,
 *
 * req.params.groupID : required
 * req.body.studentId : required
 * req.body.isAdmin : optional (default to false)
 */
// post /group/:groupId/member
export const updateMember = async (req, res) => {
	try {
		const { groupId } = req.params
		const { sid } = req.decoded
		let { studentId, isAdmin } = req.body
		isAdmin = isAdmin === "true"
		logger.api.info("post /group/:groupId/member request; groupId: %s, sid: %s, studentId: %s, isAdmin: %s", groupId, sid, studentId, isAdmin);

		if (!studentId) {
			logger.api.error("post /group/:groupId/member request error; 400 - null studentId");
			res.status(400).json({
				error: "bad request: null studentId",
			})
			return
		}

		const self = await User.findOne({ sso_sid: sid })
		if (self.studentId === studentId) {
			logger.api.error("post /group/:groupId/member request error; 403 - cannot change your own permission");
			res.status(403).json({
				error: "forbidden: cannot change your own permission",
			})
			return
		}

	const user = await User.findOne({ studentId })
	if (!user) {
		logger.api.error("post /group/:groupId/member request error; 404 - student does not exist");
		res.status(404).json({
			error: "not found: student does not exist",
		});
		return
	}

		const group = await Group.findOne({
			_id: groupId
		})
		const found = group.members.find(m => (m.studentId === studentId))
		let newGroup
		if (found) {
			/* If already a member */
			newGroup = await Group.findOneAndUpdate({
				_id: groupId,
				"members.studentId": studentId
			}, {
				$set: { "members.$": { studentId, isAdmin: !!isAdmin }}
			}, {
				new: true,
			})
		} else {
			/* If not a member */
			newGroup = await Group.findOneAndUpdate({
				_id: groupId,
			}, {
				$push: {
					members: {
						studentId,
						isAdmin
					}
				}
			}, {
				new: true
			})
			await User.findOneAndUpdate({
				studentId
			}, {
				$push: {
					groups: newGroup._id
				}
			})
		}
		res.json(newGroup)
	} catch(error) {
		logger.api.error(error)
		res.status(500).json({
			error: error.message
		})
	}
}

// delete /group/:groupId/member
export const deleteMember = async (req, res) => {
	try {
		const { groupId } = req.params
		const { sid } = req.decoded
		let { studentId } = req.body
		logger.api.info("delete /group/:groupId/member request; groupId: %s, sid: %s, studentId: %s", groupId, sid, studentId);

		if (!studentId) {
			logger.api.error("delete /group/:groupId/member request error; 400 - null studentId");
			res.status(400).json({
				error: "bad request: null studentId",
			});
			return
		}

		const self = await User.findOne({ sso_sid: sid })
		if (self.studentId === studentId) {
			logger.api.error("delete /group/:groupId/member request error; 403 - cannot change your own permission");
			res.status(403).json({
				error: "forbidden: cannot change your own permission",
			})
			return
		}

		const user = await User.findOne({ studentId })
		if (!user) {
			logger.api.error("delete /group/:groupId/member request error; 404 - student does not exist");
			res.status(404).json({
				error: "not found: student does not exist",
			})
			return
		}
		const group = await Group.findOneAndUpdate({
			_id: groupId,
		}, {
			$pull: {
				members: {
					studentId,
				}
			}
		}, {
			new: true
		})

		await User.findOneAndUpdate({ // TODO : combine with below query
			studentId
		}, {
			$pull: {
				groups: groupId
			}
		})
		if (group._id.equals(user.currentGroup)) {
			await User.findOneAndUpdate({
				studentId
			}, {
				$set: {
					currentGroup: null
				}
			})
		}
		res.json(group)

	} catch (error) {
		logger.api.error(error)
		return res.status(500).json({
			error: error.message,
		});
	}
}

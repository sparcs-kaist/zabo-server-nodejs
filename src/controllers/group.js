import { Group, User } from "../db"

export const getGroupInfo = async (req, res) => {
	const { groupId } = req.params
	try {
		const group = await Group.findById(groupId)
		res.json(group)
	} catch(error) {
		console.error(error)
		res.status(404).json({
			error: error.message
		})
	}
}

export const updatePhoto = async (req, res) => {
	const { groupId } = req.params
	res.json('todo')
}

/**
 * Add user as a member if not exist,
 * update isAdmin if already a member,
 *
 * req.params.groupID : required
 * req.body.studentId : required
 * req.body.isAdmin : optional (default to false)
 */
export const updateMember = async (req, res) => {
	const { groupId } = req.params
	const { sid } = req.decoded
	let { studentId, isAdmin } = req.body
	isAdmin = isAdmin === "true"

	console.log({ studentId, isAdmin })
	if (!studentId) {
		console.error("Student ID required")
		res.status(400).json({
			error: "Student Id required"
		})
		return
	}

	const self = await User.findOne({ sso_sid: sid })
	if (self.studentId === studentId) {
		console.error("Users cannot change their own permission")
		res.status(403).json({
			error: "Cannot change your own permission"
		})
		return
	}

	const user = await User.findOne({ studentId })
	if (!user) {
		console.error("Student Not Found")
		res.status(404).json({
			error: "Student Not Found"
		})
		return
	}

	try {
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
		console.error(error)
		res.status(400).json({
			error: error.message
		})
	}
}

export const deleteMember = async (req, res) => {
	const { groupId } = req.params
	const { sid } = req.decoded
	let { studentId } = req.body

	console.log({ studentId })
	if (!studentId) {
		console.error("Student ID required")
		res.status(400).json({
			error: "Student Id required"
		})
		return
	}

	const self = await User.findOne({ sso_sid: sid })
	if (self.studentId === studentId) {
		console.error("Users cannot change their own permission")
		res.status(403).json({
			error: "Cannot change your own permission"
		})
		return
	}

	const user = await User.findOne({ studentId })
	if (!user) {
		console.error("Student Not Found")
		res.status(404).json({
			error: "Student Not Found"
		})
		return
	}
	try {
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
		console.error(error)
	}
}

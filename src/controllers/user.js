import { User } from "../db"

export const getUserInfo = async (req, res) => {
	const { sid } = req.decoded
	try {
		const user = await User.findOne({ sso_sid: sid })
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

export const setCurrentGroup = async (req, res) => {
	const { sid } = req.decoded
	const { groupId } = req.params

	try {
		const user = await User.findOneAndUpdate({ sso_sid: sid }, {
			$set: {
				currentGroup: groupId
			}
		}, {
			new: true,
			projection: 'currentGroup',
			populate: {
				path: 'currentGroup',
				select: "_id name profilePhoto"
			}
		})
		res.json(user)
	} catch(error) {
		console.error(error)
	}
}

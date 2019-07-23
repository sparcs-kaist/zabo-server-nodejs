import { User } from "../db"
import logger from "../utils/logger";

// get /user/
export const getUserInfo = async (req, res) => {
	try {
		const { sid } = req.decoded
		logger.api.info("get /user/ request; sid: %s", sid);

		const user = await User.findOne({ sso_sid: sid })
			.populate('groups')
			.populate('currentGroup')
			.populate('currentGroup.members')
			.populate('boards')
		res.json(user)
	} catch(error) {
		logger.api.error(error);
		res.status(500).json({
			error: error.message
		})
	}
}

// post /user/currentGroup/:groupId
export const setCurrentGroup = async (req, res) => {
	try {
		const { sid } = req.decoded
		const { groupId } = req.params
		logger.api.info("post /user/currentGroup/:groupId request; sid: %s, groupId: %s", sid, groupId);

		const user = await User.findOneAndUpdate({ sso_sid: sid }, {
			$set: {
				currentGroup: groupId
			}
		}, {
			new: true,
			projection: 'currentGroup',
			populate: {
				path: 'currentGroup',
			}
		})
		res.json(user)
	} catch(error) {
		logger.api.error(error);
		return res.status(500).json({
			error: error.message,
		});
	}
}

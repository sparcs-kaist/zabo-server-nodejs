import { Statistic } from "../db"
import { logger } from "../utils/logger"
import { User } from "../db"

import { EVENTS, EVENTS_MAP } from "./variables"

const stat = EVENTS.reduce((acc, cur) => ({
	...acc,
	[cur]: (data) => {
		Statistic.create({
				type: cur,
				data
			})
			.catch(error => {
				logger.event.error(`Creating ${cur} Stat Failed`)
				logger.event.error(error)
			})
	}
}), {})

stat.GET_ZABO = (req) => {
	const { id } = req.query
	const { decoded } = req
	if (!decoded) return
	const { sid } = decoded
	User.findOne({ sso_sid: sid })
		.then(user => {
			const data = {
				type: EVENTS_MAP.GET_ZABO,
				data: {
					zaboId: id,
					userSid: sid,
				}
			}
			if (user) data.userId = user._id
			Statistic.create(data)
		})
}

stat.SEARCH = (req) => {
	const { search } = req.query
	const { decoded } = req
	if (!decoded) return
	const { sid } = decoded
	User.findOne({ sso_sid: sid })
		.then(user => {
			const data = {
				type: EVENTS_MAP.SEARCH,
				data: {
					search
				}
			}
			if (user) data.userId = user._id
			Statistic.create(data)
		})
}

export { stat }

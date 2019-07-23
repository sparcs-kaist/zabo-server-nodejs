import { Statistic } from "../db"
import logger from "../utils/logger"

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
	Statistic.create({
		type: EVENTS_MAP.GET_ZABO,
		data: {
			zaboId: id,
			userSid: sid,
		}
	})
}

export { stat }

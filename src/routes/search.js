import express from "express"
import { Group, Zabo } from "../db"
import { CATEGORIES } from "../utils/variables"
import { logger } from "../utils/logger"
import { stat } from "../utils/statistic"

const router = new express.Router()

router.get("/", async (req, res) => {
	try {
		const { query } = req.query
		logger.info("post /search request; query: %s", query)
		if (!query) {
			res.status(400).send({
				error: "Search Keyword Required"
			})
			return
		}
		stat.SEARCH(req)

		// TODO : Cache search result using REDIS
		const results = await Promise.all([
			Zabo.search(query),
			Group.search(query),
		])

		results.push(
			CATEGORIES.filter(item => item.indexOf(query) > -1)
		)

		res.json({
			zabos: results[0],
			groups: results[1],
			categories: results[2],
		})
	} catch (error) {
		logger.error(error)
		res.status(500).send({
			error: error.message
		})
	}
})

export default router

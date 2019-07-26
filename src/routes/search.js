import express from "express"
import { Group, Zabo } from "../db"
import { CATEGORIES } from "../utils/variables"

const router = new express.Router()

router.get("/", async (req, res) => {
	const { query } = req.params
	if (!query) {
		res.status(400).send({
			error: "Search Keyword Required"
		})
		return
	}

	try {
		const results = await Promise.all([
			Zabo.find({ $text: { $search: query }}),
			Group.find({ $text: { $search: query }}),
		])

		results.push(
			CATEGORIES.filter(item => item.indexOf(query) > -1)
		)
	} catch (error) {
		console.error(error)
		res.status(500).send({
			error: error.message
		})
	}
})

export default router

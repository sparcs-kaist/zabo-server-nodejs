import express from "express"
import { Group, Zabo } from "../db"
import { CATEGORIES } from "../utils/variables"

const router = new express.Router()

router.get("/", async (req, res) => {
	const { keyword } = req.params
	if (!keyword) {
		res.status(400).send({
			error: "Search Keyword Required"
		})
		return
	}

	try {
		const results = await Promise.all([
			Zabo.find({ $text: { $search: keyword }}),
			Group.find({ $text: { $search: keyword }}),
		])

		results.push(
			CATEGORIES.filter(item => item.indexOf(keyword) > -1)
		)
	} catch (error) {
		console.error(error)
		res.status(500).send({
			error: error.message
		})
	}
})

export default router

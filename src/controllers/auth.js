import jwt from "jsonwebtoken"

import { Board, User } from "../db"

import SSOClient from "../utils/sso"
import { parseJSON } from "../utils"
import { stat } from "../utils/statistic"
import { logger } from "../utils/logger";

export const authCheck = async (req, res) => {
	const jwtSecret = req.app.get('jwt-secret')
	const token = (req.headers['authorization'] || "").substring(7)
	jwt.verify(token, jwtSecret, async (error, decoded) => {
		if (error) {
			console.error(error.message, error.lineNumber)
			res.status(403).json({
				error: error.message
			})
			return
		}
		req.decoded = decoded
		const { sid } = decoded
		try {
			const user = await User.findOne({ sso_sid: sid })
				.populate('groups')
				.populate('currentGroup')
				.populate('currentGroup.members')
				.populate('boards')

			res.json(user)
		} catch (error) {
			logger.error(error)
			res.sendStatus(500)
		}
	})
}

export const login = (req, res) => {
	const { url, state } = SSOClient.getLoginParams()
	req.session.state = state
	res.redirect(url)
}

export const loginCallback = async (req, res) => {
	try {
		const stateBefore = req.session.state
		const { state, code } = req.body
		logger.api.info("get /auth/callback request; state: %s, code: %s", state, code)
		const jwtSecret = req.app.get('jwt-secret')

		if (stateBefore !== state) {
			res.status(401).json({
				error: 'TOKEN MISMATCH: session might be hijacked!',
				status: 401,
			})
			return
		}

		const userData = await SSOClient.getUserInfo(code)


		const { uid, sid, email: sso_email, first_name, last_name, gender, birthday, flags, facebook_id, twitter_id, kaist_id, kaist_info, kaist_info_time, sparcs_id } = userData
		const { displayname, ku_person_type, ku_sex, ku_std_no, mail: kaist_email } = parseJSON(kaist_info)

		const user = await User.findOne({ sso_sid: sid })

		let boards
		if (user) {
			boards = user.boards
		} else {
			logger.event.info("===== New User Has Registered | %s - %s %s ===", ku_std_no, first_name, last_name)
			const board = await Board.create({
				title: "저장한 포스터"
			})
			boards = [board._id]
		}

		const newUser = await User.findOneAndUpdate({ sso_sid: sid }, {
			$set: {
				sso_uid: uid,
				sso_sid: sid,
				email: sso_email,
				firstName: first_name,
				lastName: last_name,
				gender,
				birthday,
				flags,
				facebookId: facebook_id,
				twitterId: twitter_id,
				kaistId: kaist_id,
				sparcsId: sparcs_id,
				studentId: ku_std_no,
				kaistPersonType: ku_person_type,
				kaistEmail: kaist_email,
				kaistInfoTime: kaist_info_time,
				boards,
			},
		}, {
			upsert: true,
			new: true,
			setDefaultsOnInsert: true,
		})
			.populate('groups')
			.populate('currentGroup')
			.populate('currentGroup.members')
			.populate('boards')

		stat.REGISTER({ userId: newUser._id })

		const token = jwt.sign({
			id: newUser._id,
			sid,
			email: sso_email,
			studentId: ku_std_no,
		}, jwtSecret, {
			expiresIn: "7d",
			issuer: "zabo-sparcs-kaist",
		})

		res.json({
			token,
			user: newUser,
		})
	} catch (error) {
		logger.error(error)
		res.sendStatus(500)
	}
}

export const logout = async (req, res) => {
	const sid = req.session.sid
	const token = req.session.token
	const jwtSecret = req.app.get('jwt-secret')

	jwt.verify(token, jwtSecret, (err, decoded) => {
		if (err) {
			return console.error(err)
		}
	}) // TODO : FIX
	//const redirectUrl = encodeURIComponent('http://ssal.sparcs.org:10001/after/logout')
	const logoutUrl = SSOClient.getLogoutUrl(sid)
	res.redirect(logoutUrl)
}

export const unregister = (req, res) => {
	res.json()
}

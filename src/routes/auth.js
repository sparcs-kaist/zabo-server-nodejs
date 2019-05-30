import express from "express"
import SSOClient from "../utils/sso"

const router = express.Router()

router.get('/login', function (req, res, next) {
	const { url, state } = SSOClient.getLoginParams();
	console.log({
		url,
		state
	})
	req.session.state = state; // state 값을 session에 저장합니다.
	res.redirect(url); // 사용자를 loginUrl로 redirect 시킵니다.
	//res.render('index', { title: 'Express' })
})


router.get('/login/callback', async (req, res) => {
	try {
		console.log("login callback ", req.query)
		const stateBefore = req.session.state
		const { state, code } = req.query
		console.log(state, code)

		if (stateBefore !== state) {
			throw new Error('TOKEN MISMATCH: session might be hijacked!');
		}

		const userData = await SSOClient.getUserInfo(code)
		console.log({
			userData,
			type: typeof userData
		})
		res.json(userData)
	} catch (err) {
		console.error(err)
		res.sendStatus(401)
	}
})

router.get('/logout', async (req, res) => {
	const sid = req.session.sid
	const redirectUrl = ''
	const logoutUrl = SSOClient.getLogoutUrl(sid)
	res.redirect(logoutUrl)
})

router.get('/unregister', (req, res) => {
	res.json()
})

module.exports = router

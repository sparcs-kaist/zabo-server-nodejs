import express from "express"

const router = express.Router()

import * as authControllers from "../controllers/auth"

router.get("/", authControllers.authCheck)
router.get('/login', authControllers.login)
router.post('/login/callback', authControllers.loginCallback)
router.get('/logout', authControllers.logout)
router.get('/unregister', authControllers.unregister)

module.exports = router

import express from 'express';

import * as authControllers from '../controllers/auth';

const router = express.Router ();

router.get ('/', authControllers.authCheck);
router.get ('/login', authControllers.login);
router.post ('/login/callback', authControllers.loginCallback);
router.get ('/logout', authControllers.logout);
router.get ('/unregister', authControllers.unregister);

module.exports = router;

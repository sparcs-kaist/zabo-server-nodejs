import express from 'express';
import * as sc from '../controllers/search';

const router = express.Router ();

router.get ('/', sc.getSearch);
router.get ('/user', sc.getUserSearch);
router.get ('/zabo/list', sc.listSearchZabos, sc.listNextSearchZabos);

export default router;

import express from 'express';
import * as profileController from '../controllers/profile';

const router = new express.Router ();

router.get ('/:name', profileController.getProfile);

export default router;

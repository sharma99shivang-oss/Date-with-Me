import { Router } from 'express';
import { createResponse } from '../controllers/responseController.js';

const router = Router();
router.post('/', createResponse);
export default router;

import { Router } from 'express';
import { createInvitation, getInvitation } from '../controllers/invitationController.js';

const router = Router();
router.post('/', createInvitation);
router.get('/:inviteCode', getInvitation);
export default router;

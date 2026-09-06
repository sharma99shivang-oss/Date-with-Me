import { Router } from 'express';
import {
  analytics, deleteResponse, deleteInvitation, exportResponses, getResponse, listInvitations, listResponses, login
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.use(requireAuth);
router.get('/analytics', analytics);
router.get('/invitations', listInvitations);
router.delete('/invitations/:inviteCode', deleteInvitation);
router.get('/responses', listResponses);
router.get('/responses/:id', getResponse);
router.delete('/responses/:id', deleteResponse);
router.get('/export', exportResponses);
export default router;

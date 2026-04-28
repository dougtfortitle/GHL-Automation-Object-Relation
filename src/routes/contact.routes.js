import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { getContactInfo } from '../controllers/contactController.js';

const router = Router();

/**
 * GET /contacts/:contactId
 * Returns contact data + extracted & normalized file number.
 */
router.get('/:contactId', webhookRateLimit, authMiddleware, getContactInfo);

export default router;

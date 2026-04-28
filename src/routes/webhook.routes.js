import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateWebhook } from '../middleware/validate.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { handleWebhook } from '../controllers/webhookController.js';

const router = Router();

/**
 * POST /webhook
 * Pipeline: rateLimit → auth → validate → handler
 */
router.post('/', webhookRateLimit, authMiddleware, validateWebhook, handleWebhook);

export default router;

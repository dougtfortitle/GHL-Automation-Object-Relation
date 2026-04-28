import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { runSchema } from '../models/schemas.js';
import { runManual } from '../controllers/runController.js';

const router = Router();

/**
 * POST /api/create-custom-relation
 * Body: { contactId?, email?, fileNumber?, customFields? }  — contactId OR email required
 * Pipeline: rateLimit → auth → validate → handler
 */
router.post('/', webhookRateLimit, authMiddleware, validate(runSchema), runManual);

export default router;

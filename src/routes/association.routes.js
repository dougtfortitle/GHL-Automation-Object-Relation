import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { associationCreateSchema } from '../models/schemas.js';
import {
  checkAssociation,
  createAssociationManual,
} from '../controllers/associationController.js';

const router = Router();

/**
 * GET  /associations/check?contactId=X&orderId=Y → check if association exists
 * POST /associations                              → create association manually
 */
router.get('/check', webhookRateLimit, authMiddleware, checkAssociation);
router.post('/', webhookRateLimit, authMiddleware, validate(associationCreateSchema), createAssociationManual);

export default router;

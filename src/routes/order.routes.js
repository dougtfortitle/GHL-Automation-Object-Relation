import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { orderSearchSchema, orderCreateSchema } from '../models/schemas.js';
import {
  searchOrder,
  createOrderManual,
  getOrderByIdHandler,
} from '../controllers/orderController.js';

const router = Router();

/**
 * POST /orders/search  → search order by file number
 * POST /orders         → create order manually
 * GET  /orders/:orderId→ get order by ID
 */
router.post('/search', webhookRateLimit, authMiddleware, validate(orderSearchSchema), searchOrder);
router.post('/', webhookRateLimit, authMiddleware, validate(orderCreateSchema), createOrderManual);
router.get('/:orderId', webhookRateLimit, authMiddleware, getOrderByIdHandler);

export default router;

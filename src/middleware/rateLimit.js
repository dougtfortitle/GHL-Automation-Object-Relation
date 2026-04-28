import rateLimit from 'express-rate-limit';

/**
 * 500 requests per minute cap on the webhook endpoint.
 * Returns 429 with JSON error body when limit is exceeded.
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Limit: 500 per minute.',
    });
  },
});

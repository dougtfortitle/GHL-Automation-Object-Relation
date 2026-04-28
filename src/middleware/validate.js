import { webhookSchema } from '../models/schemas.js';

/**
 * Generic validation middleware factory.
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  req.validatedBody = result.data;
  next();
};

// Backward compatible shorthand for webhook route
export const validateWebhook = validate(webhookSchema);

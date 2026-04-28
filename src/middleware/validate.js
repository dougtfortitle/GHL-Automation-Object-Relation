import { webhookSchema, webhookHeaderSchema } from '../models/schemas.js';

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

/**
 * Webhook-specific validation:
 * - Required fields (contactId, locationId) from headers
 * - Optional customFields from body
 */
export const validateWebhook = (req, res, next) => {
  const headerResult = webhookHeaderSchema.safeParse(req.headers);
  if (!headerResult.success) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: headerResult.error.flatten().fieldErrors,
    });
  }

  const bodyResult = webhookSchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: bodyResult.error.flatten().fieldErrors,
    });
  }

  req.validatedBody = {
    contactId: headerResult.data['x-ghl-contact-id'],
    locationId: headerResult.data['x-ghl-location-id'],
    customFields: bodyResult.data.customFields,
  };
  next();
};

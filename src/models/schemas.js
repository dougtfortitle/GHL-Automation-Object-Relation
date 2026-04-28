import { z } from 'zod';

// Required headers schema for incoming GHL webhook
export const webhookHeaderSchema = z.object({
  'x-ghl-contact-id': z.string().min(1, 'x-ghl-contact-id header is required'),
  'x-ghl-location-id': z.string().min(1, 'x-ghl-location-id header is required'),
});

// Optional body schema for incoming GHL webhook
export const webhookSchema = z.object({
  customFields: z
    .array(
      z.object({
        id: z.string(),
        value: z.unknown(),
      }),
    )
    .optional()
    .default([]),
});

// GHL Contact response schema (fields we care about)
export const ghlContactSchema = z.object({
  id: z.string(),
  customFields: z
    .array(
      z.object({
        id: z.string(),
        value: z.unknown(),
      }),
    )
    .optional()
    .default([]),
});

// GHL Order record schema
export const ghlOrderSchema = z.object({
  id: z.string(),
  properties: z.record(z.unknown()).optional(),
});

// Association record schema
export const ghlAssociationSchema = z.object({
  id: z.string(),
  firstRecordId: z.string(),
  secondRecordId: z.string(),
  associationTypeId: z.string(),
});

// Flow result schema (used in response body)
export const flowResultSchema = z.object({
  success: z.boolean(),
  status: z.enum([
    'association_created',
    'duplicate_exists',
    'file_number_missing',
    'file_number_invalid',
    'order_not_found',
    'ghl_api_error',
  ]),
  contactId: z.string(),
  fileNumber: z.string().optional(),
  orderId: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

// ─── Manual endpoint schemas ────────────────────────────────────────────

// POST /create-custom-relation — manual full-flow trigger
// Accepts contactId OR email (one is required). fileNumber is optional override.
export const runSchema = z
  .object({
    contactId: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    fileNumber: z.string().optional(),
    customFields: z
      .array(z.object({ id: z.string(), value: z.unknown() }))
      .optional()
      .default([]),
  })
  .refine((data) => data.contactId || data.email, {
    message: 'Either contactId or email is required',
    path: ['contactId'],
  });

// POST /orders/search
export const orderSearchSchema = z.object({
  fileNumber: z.string().min(1, 'fileNumber is required'),
});

// POST /orders
export const orderCreateSchema = z.object({
  fileNumber: z.string().min(1, 'fileNumber is required'),
});

// POST /associations
export const associationCreateSchema = z.object({
  contactId: z.string().min(1, 'contactId is required'),
  orderId: z.string().min(1, 'orderId is required'),
});

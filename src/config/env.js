import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  GHL_API_KEY: z.string().min(1, 'GHL_API_KEY is required'),
  GHL_LOCATION_ID: z.string().min(1, 'GHL_LOCATION_ID is required'),
  FILE_NUMBER_ID: z.string().min(1, 'FILE_NUMBER_ID is required'),
  ORDERS_OBJECT_KEY: z.string().min(1, 'ORDERS_OBJECT_KEY is required'),
  ORDERS_OBJECT_ID: z.string().min(1, 'ORDERS_OBJECT_ID is required'),
  ORDERS_FILE_NUMBER_FIELD_KEY: z.string().min(1, 'ORDERS_FILE_NUMBER_FIELD_KEY is required'),
  RECORD_ID: z.string().min(1, 'RECORD_ID is required'),
  ASSOCIATION_ID: z.string().min(1, 'ASSOCIATION_ID is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

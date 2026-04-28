import { env } from '../config/env.js';

/**
 * Verify x-ghl-location-id and x-ghl-api-key headers
 * to confirm the request is from an authorized GHL location.
 */
export const authMiddleware = (req, res, next) => {
  const locationId = req.headers['x-ghl-location-id'];
  const apiKey = req.headers['x-ghl-api-key'];

  if (!locationId || !apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: missing x-ghl-location-id or x-ghl-api-key header',
    });
  }

  if (locationId !== env.GHL_LOCATION_ID || apiKey !== env.GHL_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: invalid location or API key',
    });
  }

  next();
};

import { runFlow } from '../flow/flow.js';
import logger from '../logger/logger.js';

/**
 * POST /webhook
 * Receives GHL contact.created / contact.updated events.
 * Runs the full association flow synchronously and returns the result.
 */
export const handleWebhook = async (req, res) => {
  const payload = req.validatedBody;

  try {
    const result = await runFlow(payload);

    // HTTP status: 200 for all handled flow outcomes (including soft errors)
    // 4xx is only for middleware-level rejections (auth, validation)
    return res.status(200).json(result);
  } catch (err) {
    // Unexpected / unhandled errors
    logger.error('Unhandled error in webhookController', {
      error: err.message,
      stack: err.stack,
      contactId: payload?.contactId,
    });

    return res.status(500).json({
      success: false,
      status: 'ghl_api_error',
      contactId: payload?.contactId ?? null,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
};

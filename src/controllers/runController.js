import { runFlow } from '../flow/flow.js';
import { searchContactByEmail } from '../services/contactService.js';
import logger from '../logger/logger.js';

/**
 * POST /api/create-custom-relation
 * Manual / GHL test trigger of the full association flow.
 * Accepts contactId OR email — if email is given, looks up the contactId first.
 * Optional fileNumber override skips the contact fetch for file number extraction.
 */
export const runManual = async (req, res) => {
  let { contactId, email, fileNumber = null, customFields = [] } = req.validatedBody;

  // ── Resolve contactId from email if only email was provided ──────────
  if (!contactId && email) {
    try {
      const contact = await searchContactByEmail(email);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: `No contact found with email: ${email}`,
        });
      }
      contactId = contact.id;
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Failed to look up contact by email: ${err.message}`,
      });
    }
  }

  try {
    const result = await runFlow({
      contactId,
      customFields,
      fileNumberOverride: fileNumber,
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error('Unhandled error in runController', {
      error: err.message,
      stack: err.stack,
      contactId,
    });

    return res.status(500).json({
      success: false,
      status: 'ghl_api_error',
      contactId,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
};

import { getContact } from '../services/contactService.js';
import { normalizeFileNumber } from '../flow/normalizer.js';
import { env } from '../config/env.js';

/**
 * GET /contacts/:contactId
 * Fetch a GHL contact and extract the file number from its custom fields.
 */
export const getContactInfo = async (req, res) => {
  const { contactId } = req.params;

  try {
    const contact = await getContact(contactId);
    const fileNumberField = (contact.customFields ?? []).find(
      (f) => f.id === env.FILE_NUMBER_ID,
    );
    const normalized = normalizeFileNumber(fileNumberField?.value ?? null);

    return res.status(200).json({
      success: true,
      contact,
      fileNumber: normalized.valid ? normalized.value : null,
      fileNumberStatus: normalized.reason, // 'valid' | 'missing' | 'invalid'
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: `Failed to fetch contact: ${err.message}`,
    });
  }
};

import { env } from '../config/env.js';
import { getContact } from '../services/contactService.js';
import { searchOrderByFileNumber, createOrder } from '../services/orderService.js';
import { associationExists, createAssociation } from '../services/associationService.js';
import { normalizeFileNumber } from './normalizer.js';
import { logEvent } from '../logger/logger.js';

/**
 * Build a flow result object.
 * @param {boolean} success
 * @param {string} status
 * @param {string} contactId
 * @param {object} extras - optional: { fileNumber, orderId, error }
 */
const buildResult = (success, status, contactId, extras = {}) => ({
  success,
  status,
  contactId,
  timestamp: new Date().toISOString(),
  ...extras,
});

/**
 * Main orchestration flow for a single webhook event.
 * 1. Fetch contact + extract file number from customFields
 * 2. Normalize + validate file number
 * 3. Search / create order
 * 4. Check duplicate association
 * 5. Create association
 *
 * @param {object} payload - validated webhook body
 * @param {string} payload.contactId
 * @param {Array}  payload.customFields
 * @returns {Promise<object>} flow result (matches flowResultSchema)
 */
export const runFlow = async ({ contactId, customFields = [], fileNumberOverride = null }) => {
  // ─── Steps 1 & 2: Extract + normalize file number ─────────────────────
  let fileNumber;

  if (fileNumberOverride !== null) {
    // Manual override provided — still normalize + validate
    const normalized = normalizeFileNumber(fileNumberOverride);
    if (normalized.reason === 'missing') {
      const result = buildResult(false, 'file_number_missing', contactId);
      logEvent('warn', 'file_number_missing', result);
      return result;
    }
    if (normalized.reason === 'invalid') {
      const result = buildResult(false, 'file_number_invalid', contactId, {
        fileNumber: normalized.value,
        error: 'File number does not match pattern DD-DDDDD (e.g. 25-16354)',
      });
      logEvent('warn', 'file_number_invalid', result);
      return result;
    }
    fileNumber = normalized.value;
  } else {
    // Extract from customFields payload first, then fallback to GHL API
    let rawFileNumber = null;
    const fieldFromPayload = customFields.find((f) => f.id === env.FILE_NUMBER_ID);
    if (fieldFromPayload) {
      rawFileNumber = fieldFromPayload.value;
    } else {
      try {
        const contact = await getContact(contactId);
        const fieldFromContact = (contact.customFields ?? []).find(
          (f) => f.id === env.FILE_NUMBER_ID,
        );
        rawFileNumber = fieldFromContact?.value ?? null;
      } catch (err) {
        const result = buildResult(false, 'ghl_api_error', contactId, {
          error: `Failed to fetch contact: ${err.message}`,
        });
        logEvent('error', 'ghl_api_error', result);
        return result;
      }
    }

    const normalized = normalizeFileNumber(rawFileNumber);
    if (normalized.reason === 'missing') {
      const result = buildResult(false, 'file_number_missing', contactId);
      logEvent('warn', 'file_number_missing', result);
      return result;
    }
    if (normalized.reason === 'invalid') {
      const result = buildResult(false, 'file_number_invalid', contactId, {
        fileNumber: normalized.value,
        error: 'File number does not match pattern DD-DDDDD (e.g. 25-16354)',
      });
      logEvent('warn', 'file_number_invalid', result);
      return result;
    }
    fileNumber = normalized.value;
  }

  // ─── Step 3: Search / create order ───────────────────────────────────
  let orderId;

  try {
    const existingOrder = await searchOrderByFileNumber(fileNumber);

    if (existingOrder) {
      orderId = existingOrder.id;
    } else {
      // Create new order
      const newOrder = await createOrder(fileNumber, contactId);
      if (!newOrder?.id) {
        const result = buildResult(false, 'order_not_found', contactId, {
          fileNumber,
          error: 'Order search returned no results and creation failed',
        });
        logEvent('error', 'order_not_found', result);
        return result;
      }
      orderId = newOrder.id;
    }
  } catch (err) {
    const result = buildResult(false, 'ghl_api_error', contactId, {
      fileNumber,
      error: `Order search/create failed: ${err.message}`,
    });
    logEvent('error', 'ghl_api_error', result);
    return result;
  }

  // ─── Step 4: Check for duplicate association ──────────────────────────
  try {
    const isDuplicate = await associationExists(contactId, orderId);

    if (isDuplicate) {
      const result = buildResult(false, 'duplicate_exists', contactId, {
        fileNumber,
        orderId,
      });
      logEvent('info', 'duplicate_exists', result);
      return result;
    }
  } catch (err) {
    const result = buildResult(false, 'ghl_api_error', contactId, {
      fileNumber,
      orderId,
      error: `Association check failed: ${err.message}`,
    });
    logEvent('error', 'ghl_api_error', result);
    return result;
  }

  // ─── Step 5: Create association ───────────────────────────────────────
  try {
    await createAssociation(contactId, orderId);

    const result = buildResult(true, 'association_created', contactId, {
      fileNumber,
      orderId,
    });
    logEvent('info', 'association_created', result);
    return result;
  } catch (err) {
    const result = buildResult(false, 'ghl_api_error', contactId, {
      fileNumber,
      orderId,
      error: `Association creation failed: ${err.message}`,
    });
    logEvent('error', 'ghl_api_error', result);
    return result;
  }
};

import { env } from '../config/env.js';
import { getContact } from '../services/contactService.js';
import { searchOrderByFileNumber, createOrder } from '../services/orderService.js';
import { createAssociation } from '../services/associationService.js';
import { normalizeFileNumber } from './normalizer.js';
import { logEvent } from '../logger/logger.js';

/**
 * Build a flow result object.
 * @param {boolean} success
 * @param {string} contactId
 * @param {object} extras - optional: { fileNumber, orderId, fileNumberStatus, orderStatus, associationStatus, actionStatus, error }
 */
const buildResult = (success, contactId, extras = {}) => ({
  success,
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
      const result = buildResult(false, contactId, {
        fileNumberStatus: 'missing',
        orderStatus: 'skipped',
        associationStatus: 'skipped',
        actionStatus: 'skipped',
      });
      logEvent('warn', 'file_number_missing', result);
      return result;
    }
    if (normalized.reason === 'invalid') {
      const result = buildResult(false, contactId, {
        fileNumber: normalized.value,
        fileNumberStatus: 'invalid',
        orderStatus: 'skipped',
        associationStatus: 'skipped',
        actionStatus: 'skipped',
        error: 'File number format is invalid',
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
        const result = buildResult(false, contactId, {
          fileNumberStatus: 'unknown',
          orderStatus: 'skipped',
          associationStatus: 'skipped',
          actionStatus: 'skipped',
          error: `Failed to fetch contact: ${err.message}`,
        });
        logEvent('error', 'ghl_api_error', result);
        return result;
      }
    }

    const normalized = normalizeFileNumber(rawFileNumber);
    if (normalized.reason === 'missing') {
      const result = buildResult(false, contactId, {
        fileNumberStatus: 'missing',
        orderStatus: 'skipped',
        associationStatus: 'skipped',
        actionStatus: 'skipped',
      });
      logEvent('warn', 'file_number_missing', result);
      return result;
    }
    if (normalized.reason === 'invalid') {
      const result = buildResult(false, contactId, {
        fileNumber: normalized.value,
        fileNumberStatus: 'invalid',
        orderStatus: 'skipped',
        associationStatus: 'skipped',
        actionStatus: 'skipped',
        error: 'File number format is invalid',
      });
      logEvent('warn', 'file_number_invalid', result);
      return result;
    }
    fileNumber = normalized.value;
  }

  // ─── Step 3: Search / create order ───────────────────────────────────
  let orderId;
  let orderStatus;
  let existingOrderRelations = [];

  try {
    const existingOrder = await searchOrderByFileNumber(fileNumber);

    if (existingOrder) {
      orderId = existingOrder.id;
      orderStatus = 'found';
      existingOrderRelations = existingOrder.relations ?? [];
    } else {
      // Create new order
      const newOrder = await createOrder(fileNumber, contactId);
      if (!newOrder?.id) {
        const result = buildResult(false, contactId, {
          fileNumber,
          fileNumberStatus: 'valid',
          orderStatus: 'creation_failed',
          associationStatus: 'skipped',
          actionStatus: 'order_creation_failed',
          error: 'Order search returned no results and creation failed',
        });
        logEvent('error', 'order_not_found', result);
        return result;
      }
      orderId = newOrder.id;
      orderStatus = 'created';
    }
  } catch (err) {
    const result = buildResult(false, contactId, {
      fileNumber,
      fileNumberStatus: 'valid',
      orderStatus: 'error',
      associationStatus: 'skipped',
      actionStatus: 'order_step_failed',
      error: `Order search/create failed: ${err.message}`,
    });
    logEvent('error', 'ghl_api_error', result);
    return result;
  }

  // ─── Step 4: Check for duplicate association ──────────────────────────
  const isDuplicate = existingOrderRelations.some(
    (rel) => rel.associationId === env.ASSOCIATION_ID && rel.recordId === contactId,
  );

  if (isDuplicate) {
    const result = buildResult(false, contactId, {
      fileNumber,
      fileNumberStatus: 'valid',
      orderId,
      orderStatus,
      associationStatus: 'duplicate',
      actionStatus: 'skipped',
    });
    logEvent('info', 'duplicate_exists', result);
    return result;
  }

  // ─── Step 5: Create association ───────────────────────────────────────
  try {
    await createAssociation(contactId, orderId);

    const result = buildResult(true, contactId, {
      fileNumber,
      fileNumberStatus: 'valid',
      orderId,
      orderStatus,
      associationStatus: 'created',
      actionStatus: 'association_created',
    });
    logEvent('info', 'association_created', result);
    return result;
  } catch (err) {
    const result = buildResult(false, contactId, {
      fileNumber,
      fileNumberStatus: 'valid',
      orderId,
      orderStatus,
      associationStatus: 'creation_failed',
      actionStatus: 'association_step_failed',
      error: `Association creation failed: ${err.message}`,
    });
    logEvent('error', 'ghl_api_error', result);
    return result;
  }
};

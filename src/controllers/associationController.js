import { associationExists, createAssociation } from '../services/associationService.js';

/**
 * GET /associations/check?contactId=X&orderId=Y
 * Check whether a Contact ↔ Order association already exists.
 */
export const checkAssociation = async (req, res) => {
  const { contactId, orderId } = req.query;

  if (!contactId || !orderId) {
    return res.status(422).json({
      success: false,
      error: 'Query params contactId and orderId are both required',
    });
  }

  try {
    const exists = await associationExists(contactId, orderId);
    return res.status(200).json({ success: true, exists, contactId, orderId });
  } catch (err) {
    return res.status(502).json({ success: false, error: `GHL API error: ${err.message}` });
  }
};

/**
 * POST /associations
 * Manually create a Contact ↔ Order association.
 * Returns 409 if the association already exists.
 */
export const createAssociationManual = async (req, res) => {
  const { contactId, orderId } = req.validatedBody;

  try {
    const exists = await associationExists(contactId, orderId);
    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'Association between this contact and order already exists',
        contactId,
        orderId,
      });
    }

    const association = await createAssociation(contactId, orderId);
    return res.status(201).json({ success: true, association, contactId, orderId });
  } catch (err) {
    return res.status(502).json({ success: false, error: `GHL API error: ${err.message}` });
  }
};

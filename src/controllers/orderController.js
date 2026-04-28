import {
  searchOrderByFileNumber,
  createOrder,
  getOrderById,
} from '../services/orderService.js';
import { normalizeFileNumber } from '../flow/normalizer.js';

/**
 * POST /orders/search
 * Search for an order by file number.
 */
export const searchOrder = async (req, res) => {
  const { fileNumber } = req.validatedBody;
  const normalized = normalizeFileNumber(fileNumber);

  if (!normalized.valid) {
    return res.status(422).json({
      success: false,
      error:
        normalized.reason === 'missing'
          ? 'fileNumber is required'
          : 'Invalid format. Expected DD-DDDDD (e.g. 25-16354)',
    });
  }

  try {
    const order = await searchOrderByFileNumber(normalized.value);
    return res.status(200).json({
      success: true,
      found: !!order,
      fileNumber: normalized.value,
      order: order ?? null,
    });
  } catch (err) {
    return res.status(502).json({ success: false, error: `GHL API error: ${err.message}` });
  }
};

/**
 * POST /orders
 * Manually create an order for a given file number.
 * Returns 409 if an order with the same file number already exists.
 */
export const createOrderManual = async (req, res) => {
  const { fileNumber } = req.validatedBody;
  const normalized = normalizeFileNumber(fileNumber);

  if (!normalized.valid) {
    return res.status(422).json({
      success: false,
      error:
        normalized.reason === 'missing'
          ? 'fileNumber is required'
          : 'Invalid format. Expected DD-DDDDD (e.g. 25-16354)',
    });
  }

  try {
    const existing = await searchOrderByFileNumber(normalized.value);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An order with this file number already exists',
        order: existing,
      });
    }

    const order = await createOrder(normalized.value);
    return res.status(201).json({ success: true, order });
  } catch (err) {
    return res.status(502).json({ success: false, error: `GHL API error: ${err.message}` });
  }
};

/**
 * GET /orders/:orderId
 * Fetch a specific order by its GHL record ID.
 */
export const getOrderByIdHandler = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await getOrderById(orderId);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(502).json({ success: false, error: `GHL API error: ${err.message}` });
  }
};

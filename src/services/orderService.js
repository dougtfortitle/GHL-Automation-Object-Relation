import ghlClient from '../config/ghlClient.js';
import { env } from '../config/env.js';

/**
 * Search for an order record by file number.
 * @param {string} fileNumber - normalized file number (e.g. "25-16354")
 * @returns {Promise<object|null>} order record or null if not found
 */
export const searchOrderByFileNumber = async (fileNumber) => {
  const response = await ghlClient.post(
    `/objects/${env.ORDERS_OBJECT_KEY}/records/search`,
    {
      filter: {
        filters: [
          {
            field: env.ORDERS_FILE_NUMBER_FIELD_KEY,
            operator: 'eq',
            value: fileNumber,
          },
        ],
        groupOperator: 'AND',
      },
      page: 1,
      pageSize: 1,
    },
  );

  const records = response.data?.data ?? response.data?.records ?? [];
  return records.length > 0 ? records[0] : null;
};

/**
 * Create a new order record in GHL.
 * @param {string} fileNumber
 * @param {string} contactId
 * @returns {Promise<object>} created order record
 */
export const createOrder = async (fileNumber, contactId) => {
  const response = await ghlClient.post(
    `/objects/${env.ORDERS_OBJECT_KEY}/records`,
    {
      properties: {
        [env.ORDERS_FILE_NUMBER_FIELD_KEY]: fileNumber,
      },
    },
  );

  return response.data?.record ?? response.data;
};

/**
 * Fetch an order record by its ID.
 * @param {string} orderId
 * @returns {Promise<object>} order record
 */
export const getOrderById = async (orderId) => {
  const response = await ghlClient.get(
    `/objects/${env.ORDERS_OBJECT_KEY}/records/${orderId}`,
  );
  return response.data?.record ?? response.data;
};

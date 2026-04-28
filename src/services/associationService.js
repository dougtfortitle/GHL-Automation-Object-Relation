import ghlClient from '../config/ghlClient.js';
import { env } from '../config/env.js';

/**
 * Check if a Contact ↔ Order association already exists.
 * Searches order records (search endpoint returns relations array).
 * @param {string} contactId
 * @param {string} orderId
 * @returns {Promise<boolean>}
 */
export const associationExists = async (contactId, orderId) => {
  const response = await ghlClient.post(
    `/objects/${env.ORDERS_OBJECT_KEY}/records/search`,
    {
      locationId: env.GHL_LOCATION_ID,
      filters: [
        {
          field: `properties.${env.ORDERS_FILE_NUMBER_FIELD_KEY}`,
          operator: 'is_not_empty',
        },
      ],
      page: 1,
      pageLimit: 500,
    },
  );

  const records = response.data?.records ?? [];
  const orderRecord = records.find((r) => r.id === orderId);
  if (!orderRecord) return false;

  const relations = orderRecord.relations ?? [];
  return relations.some(
    (rel) =>
      rel.associationId === env.ASSOCIATION_ID &&
      rel.recordId === contactId,
  );
};

/**
 * Create a Contact ↔ Order association using the bulk relations endpoint.
 * @param {string} contactId
 * @param {string} orderId
 * @returns {Promise<object>} bulk result data
 */
export const createAssociation = async (contactId, orderId) => {
  const response = await ghlClient.post('/associations/relations/bulk', {
    locationId: env.GHL_LOCATION_ID,
    add: [
      {
        associationId: env.ASSOCIATION_ID,
        firstRecordId: contactId,
        secondRecordId: orderId,
      },
    ],
  });

  const errored = response.data?.results?.errored ?? [];
  if (errored.length > 0) {
    const firstError = errored[0];
    throw new Error(firstError?.error || 'Failed to create relation');
  }

  return response.data;
};

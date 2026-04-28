import ghlClient from '../config/ghlClient.js';
import { env } from '../config/env.js';

/**
 * Check if a Contact ↔ Order association already exists.
 * Uses bulk relations endpoint to avoid fetching all associations.
 * @param {string} contactId
 * @param {string} orderId
 * @returns {Promise<boolean>}
 */
export const associationExists = async (contactId, orderId) => {
  const response = await ghlClient.post('/associations/relations/bulk', {
    associationTypeId: env.ASSOCIATION_ID,
    firstRecordIds: [contactId],
  });

  const relations = response.data?.data ?? response.data?.relations ?? [];
  return relations.some(
    (rel) =>
      (rel.firstRecordId === contactId && rel.secondRecordId === orderId) ||
      (rel.firstRecordId === orderId && rel.secondRecordId === contactId),
  );
};

/**
 * Create a Contact ↔ Order association.
 * @param {string} contactId
 * @param {string} orderId
 * @returns {Promise<object>} created association record
 */
export const createAssociation = async (contactId, orderId) => {
  const response = await ghlClient.post('/associations/', {
    firstRecordId: contactId,
    secondRecordId: orderId,
    associationTypeId: env.ASSOCIATION_ID,
  });

  return response.data?.association ?? response.data;
};

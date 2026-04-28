import ghlClient from '../config/ghlClient.js';
import { env } from '../config/env.js';

/**
 * Fetch a GHL contact by contactId.
 * Returns the full contact object including customFields.
 * @param {string} contactId
 * @returns {Promise<object>} contact
 */
export const getContact = async (contactId) => {
  const response = await ghlClient.get(`/contacts/${contactId}`);
  return response.data?.contact ?? response.data;
};

/**
 * Search for a GHL contact by email address.
 * Returns the first matching contact or null if not found.
 * @param {string} email
 * @returns {Promise<object|null>} contact or null
 */
export const searchContactByEmail = async (email) => {
  const response = await ghlClient.get('/contacts/', {
    params: { locationId: env.GHL_LOCATION_ID, email },
  });
  const contacts = response.data?.contacts ?? [];
  return contacts.length > 0 ? contacts[0] : null;
};

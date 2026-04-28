// File number pattern: digits-digits (e.g. 25-16354, 2516-354363, 2024-16354)
const FILE_NUMBER_REGEX = /^\d+-\d+$/;

/**
 * Normalize and validate a raw file number value.
 * Steps: trim → uppercase → strip internal spaces → regex validate
 *
 * @param {unknown} rawValue - raw value from GHL customField
 * @returns {{ valid: boolean, value: string|null, reason: 'valid'|'missing'|'invalid' }}
 */
export const normalizeFileNumber = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { valid: false, value: null, reason: 'missing' };
  }

  const normalized = String(rawValue).trim().toUpperCase().replace(/\s+/g, '');

  if (normalized === '') {
    return { valid: false, value: null, reason: 'missing' };
  }

  if (!FILE_NUMBER_REGEX.test(normalized)) {
    return { valid: false, value: normalized, reason: 'invalid' };
  }

  return { valid: true, value: normalized, reason: 'valid' };
};

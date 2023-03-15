export {
  findDocuments,
  countDocuments,
  fetchShardingKeys,
} from './cancellable-queries';

/**
 * Get the size for the string value.
 * Returns 1 with an empty string.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
export const fieldStringLen = (value: unknown) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};

export function objectContainsRegularExpression(obj: unknown): boolean {
  // This assumes that the input is not circular.
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  if (Object.prototype.toString.call(obj) === '[object RegExp]') {
    return true;
  }
  return Object.values(obj).some(objectContainsRegularExpression);
}

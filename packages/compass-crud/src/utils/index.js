export {
  findDocuments,
  countDocuments,
  fetchShardingKeys,
  OPERATION_CANCELLED_MESSAGE,
} from './cancellable-queries';

/**
 * Get the size for the string value.
 * Returns 1 with an empty string.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
export const fieldStringLen = (value) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};

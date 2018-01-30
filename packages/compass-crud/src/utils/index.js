/**
 * Get the size for the string value.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
const size = (value) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};

export default size;

const moment = require('moment');

/**
 * The date format.
 */
const FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

/**
 * Get the size for the string value.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
function size(value) {
  const length = String(value).length;
  return length === 0 ? 1 : length;
}

/**
 * Get the size value for an input field when editing.
 *
 * @param {Object} value - The value.
 * @param {String} type - The type.
 *
 * @returns {Integer} The size.
 */
function inputSize(value, type) {
  switch (type) {
    case 'Int32':
      return size(value.valueOf());
    case 'Int64':
      return size(value);
    case 'Double':
      return size(value.value);
    case 'Date':
      return size(moment(value).format(FORMAT));
    default:
      return size(value);
  }
}

module.exports.inputSize = inputSize;

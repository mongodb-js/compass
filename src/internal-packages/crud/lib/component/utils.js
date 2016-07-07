'use strict';

/**
 * Get the size value for an input field when editing.
 *
 * @param {Object} value - The value.
 *
 * @returns {Integer} The size.
 */
function inputSize(value) {
  var length = String(value).length;
  return length === 0 ? 1 : length;
}

module.exports.inputSize = inputSize;

/**
 * The identifier for testable elements.
 */
const TEST_ID = 'data-test-id';

/**
 * Get the selector for a standard unique identifier.
 *
 * @param {String} id - The id.
 *
 * @returns {String} The CSS selector.
 */
const selector = (id) => {
  return `[${TEST_ID}='${id}']`;
}

module.exports = selector;

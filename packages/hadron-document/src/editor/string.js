const StandardEditor = require('./standard');

const STRING_TYPE = 'String';

/**
 * CRUD editor for string values.
 */
class StringEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }
}

module.exports = StringEditor;
module.exports.STRING_TYPE = STRING_TYPE;

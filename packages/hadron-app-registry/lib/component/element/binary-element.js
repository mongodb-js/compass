'use strict';

const React = require('react');
const Element = require('../element');
const truncate = require('./truncator');

/**
 * Base 64 constant.
 */
const BASE_64 = 'base64';

/**
 * The new UUID type.
 */
const UUID = 4;

/**
 * The old UUID type.
 */
const UUID_OLD = 3;

/**
 * Component for binary types.
 */
class BinaryElement extends React.Component {

  /**
   * Render a binary element.
   */
  render() {
    return React.createElement(Element, { field: this.props.field, value: this._generateValue(), type: this.props.type });
  }

  /**
   * Generate the value for the binary data.
   *
   * @returns {String} The beautified binary value.
   */
  _generateValue() {
    const type = this.props.value.sub_type;
    const buffer = this.props.value.buffer;
    if (type === UUID || type === UUID_OLD) {
      return `Binary('${ truncate(buffer.toString()) }')`;
    }
    return `Binary('${ truncate(buffer.toString(BASE_64)) }')`;
  }
}

BinaryElement.displayName = 'BinaryElement';

BinaryElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = BinaryElement;
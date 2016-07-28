'use strict';

const React = require('react');
const truncate = require('hadron-app-registry').truncate;

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
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * Binary value component.
 */
class BinaryValue extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.value = props.element.currentValue;
  }

  /**
   * Render a single binary value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={VALUE_CLASS}>
        {this.renderValue()}
      </div>
    );
  }

  /**
   * Render the value.
   *
   * @returns {Component} The component.
   */
  renderValue() {
    var type = this.value.sub_type;
    var buffer = this.value.buffer;
    if (type === UUID || type === UUID_OLD) {
      return `Binary('${truncate(buffer.toString())}')`;
    }
    return `Binary('${truncate(buffer.toString(BASE_64))}')`;
  }
}

BinaryValue.displayName = 'BinaryValue';

module.exports = BinaryValue;

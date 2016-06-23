'use strict';

const React = require('react');
const truncate = require('hadron-component-registry').truncate;

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * Code value component.
 */
class CodeValue extends React.Component {

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
   * Render a single max key value.
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
    var code = this.value.code;
    return `Code('${truncate(code)}')`;
  }
}

CodeValue.displayName = 'CodeValue';

module.exports = CodeValue;

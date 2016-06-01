'use strict';

const React = require('react');
const Element = require('../element');

/**
 * Component for binary types.
 */
class BinaryElement extends React.Component {

  /**
   * Render a binary element.
   */
  render() {
    return React.createElement(Element, { field: this.props.field, value: 'Binary', type: this.props.type });
  }
}

BinaryElement.displayName = 'BinaryElement';

module.exports = BinaryElement;
'use strict';

const React = require('react');
const Element = require('../element');
const Truncator = require('./truncator');

/**
 * Component for string types.
 */
class StringElement extends React.Component {

  /**
   * Render a string element.
   */
  render() {
    return React.createElement(Element, { field: this.props.field, value: Truncator.truncate(this.props.value), type: this.props.type });
  }
}

StringElement.displayName = 'StringElement';

module.exports = StringElement;
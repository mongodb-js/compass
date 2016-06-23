'use strict';

const React = require('react');
const Element = require('../element');
const truncate = require('./truncator');

/**
 * Component for string types.
 */
class StringElement extends React.Component {

  /**
   * Render a string element.
   */
  render() {
    return (
      <Element field={this.props.field} value={truncate(this.props.value)} type={this.props.type} />
    );
  }
}

StringElement.displayName = 'StringElement';

module.exports = StringElement;

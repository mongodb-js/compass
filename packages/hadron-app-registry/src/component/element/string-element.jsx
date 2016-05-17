'use strict';

const React = require('react');
const Element = require('../element');

/**
 * The elipsis constant.
 */
const ELIPSIS = '...';

/**
 * Component for string types.
 */
class StringElement extends React.Component {

  /**
   * Render a string element.
   */
  render() {
    var string = this.props.value.length > 500 ?
      this.props.value.substring(0, 500) + ELIPSIS : this.props.value;
    return (
      <Element field={this.props.field} value={string} type={this.props.type} />
    );
  }
}

StringElement.displayName = 'StringElement';

module.exports = StringElement;

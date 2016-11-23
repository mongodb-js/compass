'use strict';

const React = require('react');
const Field = require('../field');

/**
 * Decimal128 element.
 */
class Decimal128Element extends React.Component {

  /**
   * Render a single element in a document.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return React.createElement(
      'li',
      { className: 'element' },
      React.createElement(Field, { field: this.props.field }),
      React.createElement(
        'span',
        { className: 'element-separator' },
        ':'
      ),
      React.createElement(
        'div',
        {
          className: `element-value element-value-is-${ this.props.type.toLowerCase() }`,
          title: this.props.value.toString() },
        this.props.value.toString()
      )
    );
  }
}

Decimal128Element.displayName = 'Decimal128Element';

Decimal128Element.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any
};

module.exports = Decimal128Element;
'use strict';

const React = require('react');
const Field = require('../field');

/**
 * Double element.
 */
class DoubleElement extends React.Component {

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
          title: String(this.props.value.valueOf()) },
        String(this.props.value.valueOf())
      )
    );
  }
}

DoubleElement.displayName = 'DoubleElement';

DoubleElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any
};

module.exports = DoubleElement;
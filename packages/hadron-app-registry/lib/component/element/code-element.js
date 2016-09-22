'use strict';

const React = require('react');
const Field = require('../field');

/**
 * Code element component.
 */
class CodeElement extends React.Component {

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
        { className: `element-value element-value-is-${ this.props.type.toLowerCase() }`, title: 'Code' },
        this.props.value.code
      )
    );
  }
}

CodeElement.displayName = 'CodeElement';

CodeElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = CodeElement;
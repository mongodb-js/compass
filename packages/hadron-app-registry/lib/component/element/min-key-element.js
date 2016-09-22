'use strict';

const React = require('react');
const Field = require('../field');

/**
 * MinKey element component.
 */
class MinKeyElement extends React.Component {

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
          title: 'MinKey' },
        'MinKey()'
      )
    );
  }
}

MinKeyElement.displayName = 'MinKeyElement';

MinKeyElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired
};

module.exports = MinKeyElement;
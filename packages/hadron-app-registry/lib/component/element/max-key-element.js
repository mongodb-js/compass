'use strict';

const React = require('react');
const Field = require('./field');

/**
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * MaxKey element component.
 */
class MaxKeyElement extends React.Component {

  /**
   * Render a single element in a document.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return React.createElement(
      'li',
      { className: `${ PROPERTY_CLASS } ${ this.props.type.toLowerCase() }` },
      React.createElement(Field, { field: this.props.field }),
      ':',
      React.createElement(
        'div',
        { className: VALUE_CLASS, title: 'MaxKey' },
        'MaxKey'
      )
    );
  }
}

MaxKeyElement.displayName = 'MaxKeyElement';

module.exports = MaxKeyElement;
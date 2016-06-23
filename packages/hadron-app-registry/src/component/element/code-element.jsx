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
 * Code element component.
 */
class CodeElement extends React.Component {

  /**
   * Render a single element in a document.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <li className={`${PROPERTY_CLASS} ${this.props.type.toLowerCase()}`}>
        <Field field={this.props.field} />
        :
        <div className={VALUE_CLASS} title='Code'>
          {this.props.value.code}
        </div>
      </li>
    );
  }
}

CodeElement.displayName = 'CodeElement';

module.exports = CodeElement;

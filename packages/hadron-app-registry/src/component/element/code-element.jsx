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
    return (
      <li className="element">
        <Field field={this.props.field} />
        <span className="element-separator">:</span>
        <div className={`element-value element-value-is-${this.props.type.toLowerCase()}`} title="Code">
          {this.props.value.code}
        </div>
      </li>
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

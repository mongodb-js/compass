'use strict';

const React = require('react');
const Field = require('./field');

/**
 * General element component.
 */
class Element extends React.Component {

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
        <div
          className={`element-value element-value-is-${this.props.type.toLowerCase()}`}
          title={this.props.value}>
          {String(this.props.value)}
        </div>
      </li>
    );
  }
}

Element.displayName = 'Element';

Element.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any
};

module.exports = Element;

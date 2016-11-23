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
    return (
      <li className="element">
        <Field field={this.props.field} />
        <span className="element-separator">:</span>
        <div
          className={`element-value element-value-is-${this.props.type.toLowerCase()}`}
          title={String(this.props.value.valueOf())}>
          {String(this.props.value.valueOf())}
        </div>
      </li>
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

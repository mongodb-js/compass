'use strict';

const React = require('react');
const Field = require('../field');

/**
 * Int32 element.
 */
class Int32Element extends React.Component {

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

Int32Element.displayName = 'Int32Element';

Int32Element.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any
};

module.exports = Int32Element;

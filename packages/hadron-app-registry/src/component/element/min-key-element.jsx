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
    return (
      <li className="element">
        <Field field={this.props.field} />
        <span className="element-separator">:</span>
        <div
          className={`element-value element-value-is-${this.props.type.toLowerCase()}`}
          title="MinKey">
          MinKey()
        </div>
      </li>
    );
  }
}

MinKeyElement.displayName = 'MinKeyElement';

MinKeyElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired
};

module.exports = MinKeyElement;

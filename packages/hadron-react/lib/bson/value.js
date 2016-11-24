const React = require('react');

/**
 * General BSON value component.
 */
class Value extends React.Component {

  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return React.createElement(
      'div',
      {
        className: `element-value element-value-is-${ this.props.type.toLowerCase() }`,
        title: this.props.value },
      String(this.props.value)
    );
  }
}

Value.displayName = 'BsonValue';

Value.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Value;
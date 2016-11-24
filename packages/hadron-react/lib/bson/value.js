const React = require('react');

/**
 * The base css class.
 */
const CLASS = 'element-value';

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
    const value = String(this.props.value);
    return React.createElement(
      'div',
      { className: `${ CLASS } ${ CLASS }-is-${ this.props.type.toLowerCase() }`, title: value },
      value
    );
  }
}

Value.displayName = 'BsonValue';

Value.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Value;
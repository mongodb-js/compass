const React = require('react');

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON double value component.
 */
class Double extends React.Component {

  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = String(this.props.value.value);
    return React.createElement(
      'div',
      { className: `${ CLASS } ${ CLASS }-is-${ this.props.type.toLowerCase() }`, title: value },
      value
    );
  }
}

Double.displayName = 'BsonDoubleValue';

Double.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Double;
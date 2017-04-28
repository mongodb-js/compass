const React = require('react');
const PropTypes = require('prop-types');

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

Value.displayName = 'Value';

Value.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any
};

module.exports = Value;
const React = require('react');

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON string value component.
 */
class StringValue extends React.Component {

  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return React.createElement(
      'div',
      { className: `${ CLASS } ${ CLASS }-is-string`, title: this.props.value },
      `\"${ this.props.value }\"`
    );
  }
}

StringValue.displayName = 'StringValue';

StringValue.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.string.isRequired
};

module.exports = StringValue;
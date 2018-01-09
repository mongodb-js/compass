const React = require('react');
const PropTypes = require('prop-types');
const { truncate } = require('hadron-react-utils');

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
      `\"${ truncate(this.props.value, 70) }\"`
    );
  }
}

StringValue.displayName = 'StringValue';

StringValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

module.exports = StringValue;
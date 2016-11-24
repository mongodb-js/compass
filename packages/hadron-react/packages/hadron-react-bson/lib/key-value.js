const React = require('react');

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON key value component.
 */
class Key extends React.Component {

  /**
   * Render a single generic BSON key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = `${ String(this.props.value.constructor.name) }()`;
    return React.createElement(
      'div',
      { className: `${ CLASS } ${ CLASS }-is-${ this.props.type.toLowerCase() }`, title: value },
      value
    );
  }
}

Key.displayName = 'KeyValue';

Key.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Key;
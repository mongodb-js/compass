const React = require('react');
const PropTypes = require('prop-types');

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON DBRef component.
 */
class DBRefValue extends React.Component {

  /**
   * Render a single BSON DBRef value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const dbref = this.props.value;
    const value = `DBRef(${ dbref.namespace }, ${ String(dbref.oid) }, ${ dbref.db })`;
    return React.createElement(
      'div',
      { className: `${ CLASS } ${ CLASS }-is-${ this.props.type.toLowerCase() }`, title: value },
      value
    );
  }
}

DBRefValue.displayName = 'DBRefValue';

DBRefValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any
};

module.exports = DBRefValue;
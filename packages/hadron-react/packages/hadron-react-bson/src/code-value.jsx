const React = require('react');

/**
 * The component class name.
 */
const CLASS = 'element-value element-value-is-code';

/**
 * BSON code value component.
 */
class Code extends React.Component {

  /**
   * Render a single BSON code value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = `Code('${this.props.value.code}', ${JSON.stringify(this.props.value.scope)})`;
    return (
      <div className={CLASS} title={value}>
        {value}
      </div>
    );
  }
}

Code.displayName = 'ElementCode';

Code.propTypes = {
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Code;

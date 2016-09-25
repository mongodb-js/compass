const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'element-value';

/**
 * MinKey value component.
 */
class MinKeyValue extends React.Component {

  style() {
    return `${VALUE_CLASS} ${VALUE_CLASS}-is-minkey`;
  }

  /**
   * Render a single min key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={this.style()}>
        MinKey
      </div>
    );
  }
}

MinKeyValue.displayName = 'MinKeyValue';

module.exports = MinKeyValue;

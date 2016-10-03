const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'element-value';

/**
 * MaxKey value component.
 */
class MaxKeyValue extends React.Component {

  style() {
    return `${VALUE_CLASS} ${VALUE_CLASS}-is-minkey`;
  }

  /**
   * Render a single max key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={this.style()}>
        MaxKey
      </div>
    );
  }
}

MaxKeyValue.displayName = 'MaxKeyValue';

module.exports = MaxKeyValue;

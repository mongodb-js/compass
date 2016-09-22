const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'document-property-value';

/**
 * MinKey value component.
 */
class MinKeyValue extends React.Component {

  /**
   * Render a single min key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={VALUE_CLASS}>
        MinKey
      </div>
    );
  }
}

MinKeyValue.displayName = 'MinKeyValue';

module.exports = MinKeyValue;

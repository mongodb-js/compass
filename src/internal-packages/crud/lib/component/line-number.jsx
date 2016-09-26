const React = require('react');

/**
 * The BEM base style name for the element.
 */
const BEM_BASE = 'line-number';

/**
 * Line number component.
 */
class LineNumber extends React.Component {

  /**
   * Render the line number.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={BEM_BASE}></div>
    );
  }
}

LineNumber.displayName = 'LineNumber';

module.exports = LineNumber;

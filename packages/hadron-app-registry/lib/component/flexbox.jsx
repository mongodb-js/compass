'use strict';

const React = require('react');

/**
 * The classname for the flexbox component.
 */
const CLASS = 'flexbox';

/**
 * Represents a flexbox component.
 */
class Flexbox extends React.Component {

  /**
   * Renders the flexbox component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <div className={CLASS} {...this.props}>
      </div>
    );
  }
}

module.exports = Flexbox;

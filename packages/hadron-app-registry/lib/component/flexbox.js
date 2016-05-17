'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
    return React.createElement('div', _extends({ className: CLASS }, this.props));
  }
}

Flexbox.displayName = 'Flexbox';

module.exports = Flexbox;
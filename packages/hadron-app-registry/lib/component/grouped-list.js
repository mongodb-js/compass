'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const React = require('react');

/**
 * The classname for the grouped list component.
 */
const CLASS = 'grouped-list';

/**
 * Represents a grouped list component.
 */
class GroupedList extends React.Component {

  /**
   * Renders the grouped list component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'div',
      _extends({ className: CLASS }, this.props),
      React.createElement(
        'ul',
        { className: CLASS },
        this.props.children
      )
    );
  }
}

GroupedList.displayName = 'GroupedList';

module.exports = GroupedList;
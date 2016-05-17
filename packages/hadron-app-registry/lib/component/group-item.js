'use strict';

const React = require('react');

/**
 * The classname for the group item component.
 */
const CLASS = 'group-item';

/**
 * The class name for the item header element.
 */
const HEADER = 'group-item-header';

/**
 * The class name for the item value element.
 */
const VALUE = 'group-item-value';

/**
 * Represents a group item component.
 */
class GroupItem extends React.Component {

  /**
   * Renders the group item component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'li',
      { className: CLASS, title: this.props.title },
      React.createElement(
        'a',
        null,
        React.createElement(
          'div',
          { className: HEADER },
          this.props.date
        ),
        React.createElement(
          'div',
          { className: VALUE },
          this.props.value
        )
      )
    );
  }
}

GroupItem.displayName = 'GroupItem';

module.exports = GroupItem;
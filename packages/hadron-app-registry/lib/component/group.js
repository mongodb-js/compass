'use strict';

const React = require('react');

/**
 * The classname for the group component.
 */
const CLASS = 'group';

/**
 * Represents a group component.
 */
class Group extends React.Component {

  /**
   * Renders the group component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'li',
      { className: CLASS },
      React.createElement(
        'div',
        null,
        React.createElement(
          'a',
          null,
          React.createElement('i', { className: this.props.iconClass }),
          React.createElement(
            'span',
            null,
            this.props.title
          )
        )
      ),
      React.createElement(
        'ul',
        null,
        this.props.children
      )
    );
  }
}

Group.displayName = 'Group';

module.exports = Group;
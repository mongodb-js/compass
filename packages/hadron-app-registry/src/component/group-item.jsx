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
    return (
      <li className={CLASS} title={this.props.title}>
        <a>
          <div className={HEADER}>{this.props.date}</div>
          <div className={VALUE}>{this.props.value}</div>
        </a>
      </li>
    );
  }
}

GroupItem.displayName = 'GroupItem';

module.exports = GroupItem;

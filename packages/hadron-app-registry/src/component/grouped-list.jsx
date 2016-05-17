'use strict';

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
    return (
      <div className={CLASS} {...this.props}>
        <ul className={CLASS}>
          {this.props.children}
        </ul>
      </div>
    );
  }
}

GroupedList.displayName = 'GroupedList';

module.exports = GroupedList;

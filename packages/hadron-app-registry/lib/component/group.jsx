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
    return (
      <li className={CLASS}>
        <div>
          <a>
            <i className={this.props.iconClass}></i>
            <span>{this.props.title}</span>
          </a>
        </div>
        <ul>
          {this.props.children}
        </ul>
      </li>
    );
  }
}

module.exports = Group;

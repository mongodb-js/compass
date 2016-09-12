'use strict';

const React = require('react');
const Action = require('../action/index-actions');

/**
 * Component for an index header column.
 */
class IndexHeaderColumn extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the index header column.
   *
   * @returns {React.Component} The index header column.
   */
  render() {
    return (
      <th data-hook={this.props.hook} className='active' onClick={this.handleIndexSort.bind(this)}>
        {this.props.name}
        <i className={`sort fa fa-fw ${this.props.sortOrder}`}></i>
      </th>
    );
  }

  /**
   * Handle the index sort click.
   *
   * @param {Event} evt - The event.
   */
  handleIndexSort(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.sortIndexes(evt.target.innerText);
  }
}

IndexHeaderColumn.displayName = 'IndexHeaderColumn';

module.exports = IndexHeaderColumn;

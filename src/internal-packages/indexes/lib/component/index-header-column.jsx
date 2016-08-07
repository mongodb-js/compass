'use strict';

const React = require('react');

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
      <th className={this.props.active ? 'active' : ''}>
        {this.props.name}
        <i className='sort fa fa-fw fa-sort-asc'></i>
        <i className='fa fa-fw fa-sort'></i>
      </th>
    );
  }
}

IndexHeaderColumn.displayName = 'IndexHeaderColumn';

module.exports = IndexHeaderColumn;

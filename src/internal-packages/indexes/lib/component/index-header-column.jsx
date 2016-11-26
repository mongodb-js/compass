const React = require('react');
const Action = require('../action/index-actions');
const SortIndexesStore = require('../store/sort-indexes-store');

const DEFAULT = 'Name and Definition';

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
    this.state = { sortOrder: props.sortOrder, sortField: DEFAULT };
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeSort = SortIndexesStore.listen(this.handleIndexChange.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeSort();
  }

  /**
   * Handles the sort indexes store triggering with indexes in a new order or the
   * initial load of indexes.
   *
   * @param {Array} indexes - The indexes.
   * @param {String} sortOrder - The sort order.
   * @param {String} sortField - The sort field.
   */
  handleIndexChange(indexes, sortOrder, sortField) {
    this.setState({ sortOrder: sortOrder, sortField: sortField });
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

  _renderClassName() {
    return this.state.sortField === this.props.name ? 'active' : '';
  }

  /**
   * Render the index header column.
   *
   * @returns {React.Component} The index header column.
   */
  render() {
    return (
      <th
        data-test-id={this.props.hook}
        className={this._renderClassName()}
        onClick={this.handleIndexSort.bind(this)}>
        {this.props.name}
        <i className={`sort fa fa-fw ${this.state.sortOrder}`}></i>
      </th>
    );
  }
}

IndexHeaderColumn.displayName = 'IndexHeaderColumn';

IndexHeaderColumn.propTypes = {
  sortOrder: React.PropTypes.string.isRequired,
  hook: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired
};

module.exports = IndexHeaderColumn;

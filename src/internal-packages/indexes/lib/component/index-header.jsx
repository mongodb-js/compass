const React = require('react');
const IndexHeaderColumn = require('./index-header-column');
const SortIndexesStore = require('../store/sort-indexes-store');

const ASC = 'fa-sort-asc';

/**
 * Component for the index header.
 */
class IndexHeader extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { sortOrder: ASC };
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
   */
  handleIndexChange(indexes, sortOrder) {
    this.setState({ sortOrder: sortOrder });
  }

  /**
   * Render the index header.
   *
   * @returns {React.Component} The index header.
   */
  render() {
    return (
      <thead>
        <tr>
          <IndexHeaderColumn hook="th-name" name="Name and Definition" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn hook="th-type" name="Type" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn hook="th-size" name="Size" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn hook="th-usage" name="Usage" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn hook="th-properties" name="Properties" sortOrder={this.state.sortOrder} />
          {app.preferences.isFeatureEnabled('indexDDL') ?
            <IndexHeaderColumn hook="th-drop" name="" sortOrder={this.state.sortOrder}/>
            : null}
        </tr>
      </thead>
    );
  }
}

IndexHeader.displayName = 'IndexHeader';

module.exports = IndexHeader;

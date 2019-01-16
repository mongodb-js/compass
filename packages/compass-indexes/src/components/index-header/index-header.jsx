import React from 'react';
import IndexHeaderColumn from 'components/index-header-column';
import { SortIndexesStore } from 'stores';

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
    const appRegistry = global.hadronApp.appRegistry;
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.state = {
      sortOrder: ASC,
      isWritable: this.WriteStateStore.state.isWritable,
      description: this.WriteStateStore.state.description
    };
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeSort = SortIndexesStore.listen(this.handleIndexChange.bind(this));
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeSort();
    this.unsubscribeStateStore();
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
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
          <IndexHeaderColumn
            dataTestId="index-header-name" name="Name and Definition" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn
            dataTestId="index-header-type" name="Type" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn
            dataTestId="index-header-size" name="Size" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn
            dataTestId="index-header-usage" name="Usage" sortOrder={this.state.sortOrder} />
          <IndexHeaderColumn
            dataTestId="index-header-properties" name="Properties" sortOrder={this.state.sortOrder} />
          {(!this.CollectionStore.isReadonly() && this.state.isWritable) ?
            <IndexHeaderColumn
              dataTestId="index-header-drop" name="Drop" sortOrder={this.state.sortOrder}/>
            : null}
        </tr>
      </thead>
    );
  }
}

IndexHeader.displayName = 'IndexHeader';

export default IndexHeader;

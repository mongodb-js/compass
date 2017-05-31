const React = require('react');
const PropTypes = require('prop-types');
const ipc = require('hadron-ipc');

const { NamespaceStore } = require('hadron-reflux-store');

const { TOOLTIP_IDS } = require('../constants');

class SidebarCollection extends React.Component {
  constructor() {
    super();
    const appRegistry = global.hadronApp.appRegistry;
    this.handleClick = this.handleClick.bind(this);
    this.CollectionsActions = appRegistry.getAction('Database.CollectionsActions');
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.DeploymentStateStore = appRegistry.getStore('DeploymentAwareness.DeploymentStateStore');
    this.state = {
      active: false,
      isWritable: this.DeploymentStateStore.state.isWritable,
      description: this.DeploymentStateStore.state.description
    };
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.DeploymentStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;

    return _id.slice(database.length + 1);
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  handleClick() {
    if (NamespaceStore.ns !== this.props._id) {
      this.CollectionStore.setCollection(this.props);
      ipc.call('window:show-collection-submenu');
    }
  }

  handleDropCollectionClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props.database;
      const collectionName = this.getCollectionName();
      this.CollectionsActions.openDropCollectionDialog(databaseName, collectionName);
    }
  }

  renderReadonly() {
    if (this.props.readonly) {
      return (
        <i className="fa fa-lock" aria-hidden="true" />
      );
    }
  }

  render() {
    const collectionName = this.getCollectionName();
    const tooltipText = this.state.isWritable ?
      'Drop collection' :
      this.state.description;
    const tooltipOptions = {
      'data-for': TOOLTIP_IDS.DROP_COLLECTION,
      'data-effect': 'solid',
      'data-offset': "{'bottom': 10, 'left': -5}",
      'data-tip': tooltipText
    };
    let itemClassName = 'compass-sidebar-item compass-sidebar-item-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      itemClassName += ' compass-sidebar-item-is-active';
    }
    let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-collection fa fa-trash-o';
    if (!this.state.isWritable) {
      dropClassName += ' compass-sidebar-icon-is-disabled';
    }
    return (
      <div className={itemClassName}>
        <div
          onClick={this.handleClick}
          className="compass-sidebar-item-title"
          data-test-id="sidebar-collection"
          title={this.props._id} >
          {collectionName}&nbsp;
          {this.renderReadonly()}
        </div>
        <div className="compass-sidebar-item-actions compass-sidebar-item-actions-ddl">
          <i
            className={dropClassName}
            onClick={this.handleDropCollectionClick.bind(this, this.state.isWritable)}
            {...tooltipOptions}
          />
        </div>
      </div>
    );
  }
}

SidebarCollection.propTypes = {
  _id: PropTypes.string,
  database: PropTypes.string,
  capped: PropTypes.bool,
  power_of_two: PropTypes.bool,
  readonly: PropTypes.bool,
  activeNamespace: PropTypes.string.isRequired
};

module.exports = SidebarCollection;

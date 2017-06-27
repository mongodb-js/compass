const ipc = require('hadron-ipc');
const React = require('react');
const PropTypes = require('prop-types');
const { TOOLTIP_IDS } = require('../constants');
const SidebarCollection = require('./sidebar-collection');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar-database');

class SidebarDatabase extends React.Component {
  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.CollectionsActions = appRegistry.getAction('Database.CollectionsActions');
    this.DatabaseDDLActions = appRegistry.getAction('DatabaseDDL.Actions');
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
    this.state = this.WriteStateStore.state;
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  getCollectionComponents() {
    if (this.props.expanded) {
      return this.props.collections.map(c => {
        const props = {
          _id: c._id,
          database: c.database,
          capped: c.capped,
          power_of_two: c.power_of_two,
          readonly: c.readonly,
          activeNamespace: this.props.activeNamespace
        };

        return (
          <SidebarCollection key={c._id} {...props} />
        );
      });
    }
  }

  getArrowIconClasses() {
    return 'mms-icon-right-arrow compass-sidebar-icon compass-sidebar-icon-expand' +
      (this.props.expanded ? ' fa fa-rotate-90' : '');
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  handleDBClick(db) {
    if (this.NamespaceStore.ns !== db) {
      this.NamespaceStore.ns = db;
      ipc.call('window:hide-collection-submenu');
    }
  }

  handleArrowClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props._id);
    }
  }

  handleCreateCollectionClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props._id;
      this.CollectionsActions.openCreateCollectionDialog(databaseName);
    }
  }

  handleDropDBClick(isWritable) {
    if (isWritable) {
      const databaseName = this.props._id;
      this.DatabaseDDLActions.openDropDatabaseDialog(databaseName);
    }
  }

  render() {
    const createTooltipText = this.state.isWritable ?
      'Create collection' :
      this.state.description;
    const createTooltipOptions = {
      'data-for': TOOLTIP_IDS.CREATE_COLLECTION,
      'data-effect': 'solid',
      'data-offset': "{'bottom': 10, 'left': -8}",
      'data-tip': createTooltipText
    };
    const dropTooltipText = this.state.isWritable ?
      'Drop database' :
      'Drop database is not available on a secondary node';  // TODO: Arbiter/recovering/etc
    const dropTooltipOptions = {
      'data-for': TOOLTIP_IDS.DROP_DATABASE,
      'data-effect': 'solid',
      'data-offset': "{'bottom': 10, 'left': -5}",
      'data-tip': dropTooltipText
    };
    let headerClassName = 'compass-sidebar-item-header compass-sidebar-item-header-is-expandable compass-sidebar-item-header-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      headerClassName += ' compass-sidebar-item-header-is-active';
    }
    let createClassName = 'mms-icon-add-circle compass-sidebar-icon compass-sidebar-icon-create-collection';
    if (!this.state.isWritable) {
      createClassName += ' compass-sidebar-icon-is-disabled';
    }
    let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-database fa fa-trash-o';
    if (!this.state.isWritable) {
      dropClassName += ' compass-sidebar-icon-is-disabled';
    }
    return (
      <div className="compass-sidebar-item compass-sidebar-item-is-top-level" style={this.props.style}>
        <div className={headerClassName}>
          <div className="compass-sidebar-item-header-actions compass-sidebar-item-header-actions-expand">
            <i onClick={this.handleArrowClick.bind(this)} className={this.getArrowIconClasses()} />
          </div>
          <div
            onClick={this.handleDBClick.bind(this, this.props._id)}
            className="compass-sidebar-item-header-title" title={this.props._id}
            data-test-id="sidebar-database">
            {this.props._id}
          </div>
          <div className="compass-sidebar-item-header-actions compass-sidebar-item-header-actions-ddl">
            <i
              className={createClassName}
              onClick={this.handleCreateCollectionClick.bind(this, this.state.isWritable)}
              {...createTooltipOptions}
            />
            <i
              className={dropClassName}
              onClick={this.handleDropDBClick.bind(this, this.state.isWritable)}
              {...dropTooltipOptions}
            />
          </div>
        </div>
        <div className="compass-sidebar-item-content">
          {this.getCollectionComponents.call(this)}
        </div>
      </div>
    );
  }
}

SidebarDatabase.propTypes = {
  _id: PropTypes.string,
  activeNamespace: PropTypes.string.isRequired,
  collections: PropTypes.array,
  expanded: PropTypes.bool,
  style: PropTypes.object,
  onClick: PropTypes.func,
  index: PropTypes.number
};

module.exports = SidebarDatabase;

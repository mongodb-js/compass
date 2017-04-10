const app = require('hadron-app');
const ipc = require('hadron-ipc');
const React = require('react');
const { NamespaceStore } = require('hadron-reflux-store');
const { TOOLTIP_IDS } = require('./constants');
const SidebarCollection = require('./sidebar-collection');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar-database');

class SidebarDatabase extends React.Component {
  constructor(props) {
    super(props);
    // this.state = { expanded: props.expanded };
    this.CollectionsActions = app.appRegistry.getAction('Database.CollectionsActions');
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
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

  handleDBClick(db) {
    if (NamespaceStore.ns !== db) {
      this.CollectionStore.setCollection({});
      NamespaceStore.ns = db;
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
    const isWritable = app.dataService.isWritable();
    const createTooltipText = isWritable ?
      'Create collection' :
      'Create collection is not available on a secondary node';  // TODO: Arbiter/recovering/etc
    const createTooltipOptions = {
      'data-for': TOOLTIP_IDS.CREATE_COLLECTION,
      'data-effect': 'solid',
      'data-offset': "{'bottom': 10, 'left': -8}",
      'data-tip': createTooltipText
    };
    const dropTooltipText = isWritable ?
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
    if (!isWritable) {
      createClassName += ' compass-sidebar-icon-is-disabled';
    }
    let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-database fa fa-trash-o';
    if (!isWritable) {
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
              onClick={this.handleCreateCollectionClick.bind(this, isWritable)}
              {...createTooltipOptions}
            />
            <i
              className={dropClassName}
              onClick={this.handleDropDBClick.bind(this, isWritable)}
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
  _id: React.PropTypes.string,
  activeNamespace: React.PropTypes.string.isRequired,
  collections: React.PropTypes.array,
  expanded: React.PropTypes.bool,
  style: React.PropTypes.object,
  onClick: React.PropTypes.func,
  index: React.PropTypes.number
};

module.exports = SidebarDatabase;

const app = require('hadron-app');
const React = require('react');
const ipc = require('hadron-ipc');

const { NamespaceStore } = require('hadron-reflux-store');

const { TOOLTIP_IDS } = require('./constants');

class SidebarCollection extends React.Component {
  constructor() {
    super();
    this.state = {
      active: false
    };
    this.handleClick = this.handleClick.bind(this);
    this.CollectionsActions = app.appRegistry.getAction('Database.CollectionsActions');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;

    return _id.slice(database.length + 1);
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
    const isWritable = app.dataService.isWritable();
    const tooltipText = isWritable ?
      'Drop collection' :
      'Drop collection is not available on a secondary node';  // TODO: Arbiter/recovering/etc
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
    if (!isWritable) {
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
            onClick={this.handleDropCollectionClick.bind(this, isWritable)}
            {...tooltipOptions}
          />
        </div>
      </div>
    );
  }
}

SidebarCollection.propTypes = {
  _id: React.PropTypes.string,
  database: React.PropTypes.string,
  capped: React.PropTypes.bool,
  power_of_two: React.PropTypes.bool,
  readonly: React.PropTypes.bool,
  activeNamespace: React.PropTypes.string.isRequired
};

module.exports = SidebarCollection;

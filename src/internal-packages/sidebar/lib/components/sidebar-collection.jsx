const app = require('ampersand-app');
const React = require('react');
const ReactTooltip = require('react-tooltip');
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
      'data-offset': "{'bottom': 18, 'left': 3}",
      'data-tip': tooltipText
    };
    let titleClassName = 'compass-sidebar-title compass-sidebar-title-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      titleClassName += ' compass-sidebar-title-is-active';
    }
    let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-collection fa fa-trash-o';
    if (!isWritable) {
      dropClassName += ' compass-sidebar-icon-is-disabled';
    }
    return (
      <div className="compass-sidebar-item">
        <i
          className={dropClassName}
          onClick={this.handleDropCollectionClick.bind(this, isWritable)}
          {...tooltipOptions}
        />
        <ReactTooltip id={TOOLTIP_IDS.DROP_COLLECTION} />
        <div
          onClick={this.handleClick}
          className={titleClassName}
          data-test-id="sidebar-collection"
          title={this.props._id}>
          {collectionName}&nbsp;
          {this.renderReadonly()}
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

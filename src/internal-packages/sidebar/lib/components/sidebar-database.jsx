const app = require('ampersand-app');
const ipc = require('hadron-ipc');
const React = require('react');
const ReactTooltip = require('react-tooltip');
const { NamespaceStore } = require('hadron-reflux-store');
const toNS = require('mongodb-ns');

const { TOOLTIP_IDS } = require('./constants');
const SidebarCollection = require('./sidebar-collection');

class SidebarDatabase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: props.expanded };
    this.CollectionsActions = app.appRegistry.getAction('Database.CollectionsActions');
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      expanded: nextProps.expanded || toNS(nextProps.activeNamespace).database === this.props._id}
    );
  }

  getCollectionComponents() {
    if (this.state.expanded) {
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
    return 'mms-icon-right-arrow compass-sidebar-expand-icon' +
      (this.state.expanded ? ' fa-rotate-90' : '');
  }

  handleDBClick(db) {
    if (NamespaceStore.ns !== db) {
      this.CollectionStore.setCollection({});
      NamespaceStore.ns = db;
      ipc.call('window:hide-collection-submenu');
    }
  }

  handleArrowClick() {
    this.setState({ expanded: !this.state.expanded });
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
      'data-offset': "{'bottom': 18, 'left': 3}",
      'data-tip': createTooltipText
    };
    const dropTooltipText = isWritable ?
      'Drop database' :
      'Drop database is not available on a secondary node';  // TODO: Arbiter/recovering/etc
    const dropTooltipOptions = {
      'data-for': TOOLTIP_IDS.DROP_DATABASE,
      'data-effect': 'solid',
      'data-offset': "{'bottom': 18, 'left': 3}",
      'data-tip': dropTooltipText
    };
    let headerClassName = 'compass-sidebar-item-header compass-sidebar-item-header-is-expandable compass-sidebar-item-header-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      headerClassName += ' compass-sidebar-item-header-is-active';
    }
    let createClassName = 'compass-sidebar-icon compass-sidebar-icon-create-collection fa fa-plus-circle';
    if (!isWritable) {
      createClassName += ' compass-sidebar-icon-is-disabled';
    }
    let dropClassName = 'compass-sidebar-icon compass-sidebar-icon-drop-database fa fa-trash-o';
    if (!isWritable) {
      dropClassName += ' compass-sidebar-icon-is-disabled';
    }
    return (
      <div className="compass-sidebar-item compass-sidebar-item-is-top-level">
        <div className={headerClassName}>
          <i onClick={this.handleArrowClick.bind(this)} className={this.getArrowIconClasses()} />
          <i
            className={createClassName}
            onClick={this.handleCreateCollectionClick.bind(this, isWritable)}
            {...createTooltipOptions}
          />
          <ReactTooltip id={TOOLTIP_IDS.CREATE_COLLECTION} />
          <i
            className={dropClassName}
            onClick={this.handleDropDBClick.bind(this, isWritable)}
            {...dropTooltipOptions}
          />
          <ReactTooltip id={TOOLTIP_IDS.DROP_DATABASE} />
          <div
            onClick={this.handleDBClick.bind(this, this.props._id)}
            className="compass-sidebar-title" title={this.props._id}
            data-test-id="sidebar-database">
            {this.props._id}
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
  expanded: React.PropTypes.bool
};

module.exports = SidebarDatabase;

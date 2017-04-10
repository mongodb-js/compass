const React = require('react');
const ReactTooltip = require('react-tooltip');
const { AutoSizer, List } = require('react-virtualized');
const _ = require('lodash');
const app = require('hadron-app');
const { StoreConnector } = require('hadron-react-components');
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');
const { TOOLTIP_IDS } = require('./constants');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar');

const OVER_SCAN_COUNT = 100;
const ROW_HEIGHT = 28;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
    this.InstanceStore = app.appRegistry.getStore('App.InstanceStore');
    this.state = { collapsed: false, expandedDB: {}};
  }

  componentWillReceiveProps(nextProps) {
    const expandedDB = {};
    nextProps.databases.map((db) => {
      if (db._id === toNS(nextProps.activeNamespace).database) {
        expandedDB[db._id] = true;
      } else if (this.state.expandedDB.hasOwnProperty(db._id)) {
        expandedDB[db._id] = this.state.expandedDB[db._id];
      } else {
        expandedDB[db._id] = false;
      }
    });

    this.setState({expandedDB});
    this.list.recomputeRowHeights();
  }

  componentDidUpdate() {
    // Re-render tooltips once data has been fetched from mongo/d/s in a
    // performant way for data.mongodb.parts (~1500 collections)
    ReactTooltip.rebuild();
  }

  getSidebarClasses() {
    return 'compass-sidebar' +
      (this.state.collapsed ? ' compass-sidebar-collapsed' : ' compass-sidebar-expanded');
  }

  getToggleClasses() {
    return 'fa' +
      (this.state.collapsed ? ' fa-forward' : ' fa-backward');
  }

  handleCollapse() {
    if (!this.state.collapsed) {
      this.props.onCollapse();
      this.setState({ collapsed: !this.state.collapsed });
    } else {
      return null;
    }
  }

  handleExpand() {
    if (this.state.collapsed) {
      this.props.onCollapse();
      this.setState({ collapsed: !this.state.collapsed });
    } else {
      return null;
    }
  }

  handleSearchFocus() {
    this.refs.filter.focus();
  }

  handleFilter(event) {
    const searchString = event.target.value;

    let re;
    try {
      re = new RegExp(searchString, 'i');
    } catch (e) {
      re = /(?:)/;
    }

    Actions.filterDatabases(re);
  }

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      this.DatabaseDDLActions.openCreateDatabaseDialog();
    }
  }

  _calculateRowHeight({index}) {
    const db = this.props.databases[index];
    let count = 1;
    if (this.state.expandedDB[db._id]) {
      count += db.collections.length;
    }

    return count * ROW_HEIGHT;
  }

  /**
   * Set the reference of the List object to call public methods of react-virtualized
   * see link: https://github.com/bvaughn/react-virtualized/blob/master/docs/List.md#public-methods
   *
   * @param{Object} ref the react-virtualized.List reference used here
   */
  _setRef(ref) {
    this.list = ref;
  }

  /**
   * Display while sidebar list is being loaded
   * @return {DOM} element
   */
  retrievingDatabases() {
    return null;
  }

  /**
   * On expand/collapse of sidebar-database, add/remove from expandedDBs state and recompute row heights
   * @param{string} _id sidebar-database _id
   */
  _onDBClick(_id) {
    const expandedDB = _.cloneDeep(this.state.expandedDB);
    expandedDB[_id] = !expandedDB[_id];
    this.setState({expandedDB});
    this.list.recomputeRowHeights();
  }

  renderCreateDatabaseButton() {
    const isWritable = app.dataService.isWritable();
    const tooltipText = 'Not available on a secondary node';  // TODO: Arbiter/recovering/etc
    // Only show this tooltip on a secondary
    const tooltipOptions = isWritable ? {} : {
      'data-for': TOOLTIP_IDS.CREATE_DATABASE_BUTTON,
      'data-effect': 'solid',
      'data-place': 'right',
      'data-offset': "{'right': -10}",
      'data-tip': tooltipText
    };
    let className = 'compass-sidebar-button-create-database';
    if (!isWritable) {
      className += ' compass-sidebar-button-is-disabled';
    }
    return (
      <div className="compass-sidebar-button-create-database-container" {...tooltipOptions}>
        <button
          className={className}
          title="Create Database"
          onClick={this.handleCreateDatabaseClick.bind(this, isWritable)}
        >
          <i className="mms-icon-add" />
          <text className="plus-button">
            Create Database
          </text>
        </button>
      </div>
    );
  }

  renderSidebarDatabase({index, key, style}) {
    const db = this.props.databases[index];
    const props = {
      _id: db._id,
      collections: db.collections,
      expanded: this.state.expandedDB[db._id],
      activeNamespace: this.props.activeNamespace,
      onClick: this._onDBClick.bind(this),
      key,
      style,
      index
    };
    return (
      <SidebarDatabase {...props} />
    );
  }

  renderSidebarScroll() {
    return (
      <AutoSizer>
        {({height, width}) => (
        <List
          ref={'sidebar'}
          width={width}
          height={height}
          overScanRowCount={OVER_SCAN_COUNT}
          rowCount={this.props.databases.length}
          rowHeight={this._calculateRowHeight.bind(this)}
          noRowsRenderer={this.retrievingDatabases}
          rowRenderer={this.renderSidebarDatabase.bind(this)}
          ref={this._setRef.bind(this)}
        />
      )}
      </AutoSizer>
    );
  }

  render() {
    return (
      <div
        className={this.getSidebarClasses()}
        data-test-id="instance-sidebar"
        onClick={this.handleExpand.bind(this)}>
        <div className="compass-sidebar-toggle"
          onClick={this.handleCollapse.bind(this)}
          data-test-id="toggle-sidebar"
        >
          <i className={this.getToggleClasses()}></i>
        </div>
        <StoreConnector store={this.InstanceStore}>
          <SidebarInstanceProperties
            connection={app.connection}
            activeNamespace={this.props.activeNamespace}
          />
        </StoreConnector>
        <div className="compass-sidebar-filter" onClick={this.handleSearchFocus.bind(this)}>
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input data-test-id="sidebar-filter-input" ref="filter"
            className="compass-sidebar-search-input" placeholder="filter" onChange={this.handleFilter}></input>
        </div>
        <div className="compass-sidebar-content">
          {this.renderSidebarScroll()}
        </div>
        {this.renderCreateDatabaseButton()}
        <ReactTooltip id={TOOLTIP_IDS.CREATE_DATABASE_BUTTON} />
        <ReactTooltip id={TOOLTIP_IDS.CREATE_COLLECTION} />
        <ReactTooltip id={TOOLTIP_IDS.DROP_DATABASE} />
        <ReactTooltip id={TOOLTIP_IDS.DROP_COLLECTION} />
      </div>
    );
  }
}

Sidebar.propTypes = {
  instance: React.PropTypes.object,
  databases: React.PropTypes.array,
  onCollapse: React.PropTypes.func,
  activeNamespace: React.PropTypes.string,
  expanded: React.PropTypes.bool
};

module.exports = Sidebar;

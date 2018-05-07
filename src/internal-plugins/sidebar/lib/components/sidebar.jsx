const React = require('react');
const PropTypes = require('prop-types');
const ReactTooltip = require('react-tooltip');
const { AutoSizer, List } = require('react-virtualized');
const _ = require('lodash');
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');
const { TOOLTIP_IDS } = require('../constants');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar');

const OVER_SCAN_COUNT = 100;
const ROW_HEIGHT = 28;
const EXPANDED_WHITESPACE = 12;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.DatabaseDDLActions = appRegistry.getAction('DatabaseDDL.Actions');
    this.StatusActions = appRegistry.getAction('Status.Actions');
    this.state = {
      collapsed: false,
      expandedDB: {},
      isWritable: this.WriteStateStore.state.isWritable,
      description: this.WriteStateStore.state.description
    };
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    const expandedDB = {};
    nextProps.databases.map((db) => {
      if (nextProps.expandedDBList === true || db._id === toNS(nextProps.activeNamespace).database) {
        expandedDB[db._id] = true;
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

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  getSidebarClasses() {
    return 'compass-sidebar' +
      (this.state.collapsed ? ' compass-sidebar-collapsed' : ' compass-sidebar-expanded');
  }

  getToggleClasses() {
    return 'fa' +
      (this.state.collapsed ? ' fa-caret-right' : ' fa-caret-left');
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  handleCollapse() {
    if (!this.state.collapsed) {
      this.props.onCollapse();
      this.StatusActions.configure({ sidebar: false });
      this.setState({ collapsed: !this.state.collapsed });
    } else {
      return null;
    }
  }

  handleExpand() {
    if (this.state.collapsed) {
      this.props.onCollapse();
      this.StatusActions.configure({ sidebar: true });
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
    let height = ROW_HEIGHT;
    if (this.state.expandedDB[db._id]) {
      height += db.collections.length * ROW_HEIGHT + EXPANDED_WHITESPACE;
    }

    return height;
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

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
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
    if (!this.isReadonlyDistro()) {
      const tooltipText = this.state.description;
      const tooltipOptions = this.state.isWritable ? {} : {
        'data-for': TOOLTIP_IDS.CREATE_DATABASE_BUTTON,
        'data-effect': 'solid',
        'data-place': 'right',
        'data-offset': "{'right': -10}",
        'data-tip': tooltipText
      };
      let className = 'compass-sidebar-button-create-database';
      if (!this.state.isWritable) {
        className += ' compass-sidebar-button-is-disabled';
      }
      return (
        <div className="compass-sidebar-button-create-database-container" {...tooltipOptions}>
          <button
            className={className}
            title="Create Database"
            onClick={this.handleCreateDatabaseClick.bind(this, this.state.isWritable)}>
            <i className="mms-icon-add" />
            <div className="plus-button">
              Create Database
            </div>
          </button>
        </div>
      );
    }
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
          width={width}
          height={height}
          className="compass-sidebar-autosizer-list"
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
        <button className="compass-sidebar-toggle btn btn-default btn-sm"
          onClick={this.handleCollapse.bind(this)}
          data-test-id="toggle-sidebar"
        >
          <i className={this.getToggleClasses()}></i>
        </button>
        <SidebarInstanceProperties
          instance={this.props.instance}
          activeNamespace={this.props.activeNamespace}
        />
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
  instance: PropTypes.object,
  databases: PropTypes.array,
  onCollapse: PropTypes.func,
  activeNamespace: PropTypes.string,
  expandedDBList: PropTypes.bool
};

module.exports = Sidebar;

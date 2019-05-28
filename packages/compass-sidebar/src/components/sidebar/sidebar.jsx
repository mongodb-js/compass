import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';
import ReactTooltip from 'react-tooltip';
import { AutoSizer, List } from 'react-virtualized';

import classnames from 'classnames';
import styles from './sidebar.less';

import SidebarDatabase from 'components/sidebar-database';
import SidebarInstanceProperties from 'components/sidebar-instance-properties';

import { toggleIsCollapsed } from 'modules/is-collapsed';
import { filterDatabases, changeDatabases } from 'modules/databases';
import { changeFilterRegex } from 'modules/filter-regex';

import { TOOLTIP_IDS } from 'constants/sidebar-constants';

const OVER_SCAN_COUNT = 100;
const ROW_HEIGHT = 28;
const EXPANDED_WHITESPACE = 12;

class Sidebar extends PureComponent {
  static displayName = 'Sidebar';
  static propTypes = {
    databases: PropTypes.object.isRequired,
    description: PropTypes.string.isRequired,
    filterRegex: PropTypes.any.isRequired,
    instance: PropTypes.object.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    onCollapse: PropTypes.func.isRequired,
    toggleIsCollapsed: PropTypes.func.isRequired,
    filterDatabases: PropTypes.func.isRequired,
    changeDatabases: PropTypes.func.isRequired,
    changeFilterRegex: PropTypes.func.isRequired,
    isDataLake: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.StatusActions = global.hadronApp.appRegistry.getAction('Status.Actions');
  }

  componentWillReceiveProps() {
    this.list.recomputeRowHeights();
  }

  componentDidUpdate() {
    // Re-render tooltips once data has been fetched from mongo/d/s in a
    // performant way for data.mongodb.parts (~1500 collections)
    ReactTooltip.rebuild();
  }

  getSidebarClasses() {
  }

  getToggleClasses() {
  }

  handleCollapse() {
    if (!this.props.isCollapsed) {
      this.props.onCollapse();
      if (this.StatusActions) {
        this.StatusActions.configure({ sidebar: false });
      }
      this.props.toggleIsCollapsed(!this.props.isCollapsed);
    }
  }

  handleExpand() {
    if (this.props.isCollapsed) {
      this.props.onCollapse();
      if (this.StatusActions) {
        this.StatusActions.configure({ sidebar: false });
      }
      this.props.toggleIsCollapsed(!this.props.isCollapsed);
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

    this.props.changeFilterRegex(re);
    this.props.filterDatabases(re, null, null);
  }

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      global.hadronApp.appRegistry.emit('open-create-database');
    }
  }

  _calculateRowHeight({index}) {
    const db = this.props.databases.databases[index];
    let height = ROW_HEIGHT;
    if (this.props.databases.expandedDblist[db._id]) {
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
   * On expand/collapse of sidebar-database, add/remove from expandedDblists state and recompute row heights
   * @param{string} _id sidebar-database _id
   */
  _onDBClick(_id) {
    const expandedDB = cloneDeep(this.props.databases.expandedDblist);
    expandedDB[_id] = !expandedDB[_id];
    this.props.changeDatabases(this.props.databases.databases, expandedDB, this.props.databases.activeNamespace);
    this.list.recomputeRowHeights();
  }

  renderCreateDatabaseButton() {
    if (!this.isReadonlyDistro() && !this.props.isDataLake) {
      const tooltipText = this.props.description;
      const tooltipOptions = this.props.isWritable ? {} : {
        'data-for': TOOLTIP_IDS.CREATE_DATABASE_BUTTON,
        'data-effect': 'solid',
        'data-place': 'right',
        'data-offset': "{'right': -10}",
        'data-tip': tooltipText
      };
      const isW = !this.props.isWritable ? styles['compass-sidebar-button-is-disabled'] : '';
      const className = classnames(styles['compass-sidebar-button-create-database'], styles[isW]);
      return (
        <div
          className={classnames(styles['compass-sidebar-button-create-database-container'])}
          {...tooltipOptions}
        >
          <button
            className={className}
            title="Create Database"
            onClick={this.handleCreateDatabaseClick.bind(this, this.props.isWritable)}>
            <i className="mms-icon-add" />
            <div className={classnames(styles['plus-button'])}>
              Create Database
            </div>
          </button>
        </div>
      );
    }
  }

  renderSidebarDatabase({index, key, style}) {
    const db = this.props.databases.databases[index];
    const props = {
      isWritable: this.props.isWritable,
      description: this.props.description,
      _id: db._id,
      activeNamespace: this.props.databases.activeNamespace,
      collections: db.collections,
      expanded: this.props.databases.expandedDblist[db._id],
      onClick: this._onDBClick.bind(this),
      key,
      style,
      index,
      isDataLake: this.props.isDataLake
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
            rowCount={this.props.databases.databases.length}
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
    const collapsed = this.props.isCollapsed ?
      'compass-sidebar-collapsed' :
      'compass-sidebar-expanded';
    const collapsedButton = 'fa' +
      (this.props.isCollapsed ? ' fa-caret-right' : ' fa-caret-left');

    return (
      <div
        className={classnames(styles['compass-sidebar'], styles[collapsed])}
        data-test-id="instance-sidebar"
        onClick={this.handleExpand.bind(this)}>
        <button
          className={classnames(styles['compass-sidebar-toggle'], 'btn btn-default btn-sm')}
          onClick={this.handleCollapse.bind(this)}
          data-test-id="toggle-sidebar"
        >
          <i className={collapsedButton}/>
        </button>

        <SidebarInstanceProperties
          instance={this.props.instance}
          activeNamespace={this.props.databases.activeNamespace}
        />
        <div
          className={classnames(styles['compass-sidebar-filter'])}
          onClick={this.handleSearchFocus.bind(this)}>
          <i className={classnames('fa', 'fa-search', styles['compass-sidebar-search-icon'])}/>
          <input
            data-test-id="sidebar-filter-input"
            ref="filter"
            className={classnames(styles['compass-sidebar-search-input'])}
            placeholder="filter"
            onChange={this.handleFilter.bind(this)} />
        </div>
        <div className={classnames(styles['compass-sidebar-content'])}>
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

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 * @param {Object} ownProps - Props passed not through the state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state, ownProps) => ({
  databases: state.databases,
  description: state.description,
  filterRegex: state.filterRegex,
  instance: state.instance,
  isCollapsed: state.isCollapsed,
  isDblistExpanded: state.isDblistExpanded,
  isWritable: state.isWritable,
  onCollapse: ownProps.onCollapse,
  isDataLake: state.isDataLake
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedSidebar = connect(
  mapStateToProps,
  {
    toggleIsCollapsed,
    filterDatabases,
    changeDatabases,
    changeFilterRegex
  },
)(Sidebar);

export default MappedSidebar;
export { Sidebar };

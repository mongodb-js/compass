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

import { changeExpandedDblist, updateExpandedDblist } from 'modules/expanded-dblist';
import { toggleIsCollapsed } from 'modules/is-collapsed';
import { filterDatabases } from 'modules/databases';
import { toggleIsDblistExpanded } from 'modules/is-dblist-expanded';
import { changeFilterRegex } from 'modules/filter-regex';

import { TOOLTIP_IDS } from 'constants/sidebar-constants';

const OVER_SCAN_COUNT = 100;
const ROW_HEIGHT = 28;
const EXPANDED_WHITESPACE = 12;

class Sidebar extends PureComponent {
  static displayName = 'Sidebar';
  static propTypes = {
    activeNamespace: PropTypes.string.isRequired,
    databases: PropTypes.array.isRequired,
    description: PropTypes.string.isRequired,
    expandedDblist: PropTypes.object.isRequired,
    filterRegex: PropTypes.any.isRequired,
    instance: PropTypes.object.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    isDblistExpanded: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    onCollapse: PropTypes.func.isRequired,
    toggleIsCollapsed: PropTypes.func.isRequired,
    filterDatabases: PropTypes.func.isRequired,
    changeExpandedDblist: PropTypes.func.isRequired,
    updateExpandedDblist: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.StatusActions = global.hadronApp.appRegistry.getAction('Status.Actions');
  }

  componentDidUpdate() {
    // Re-render tooltips once data has been fetched from mongo/d/s in a
    // performant way for data.mongodb.parts (~1500 collections)
    ReactTooltip.rebuild();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.list.recomputeRowHeights();
  }

  getSidebarClasses() {
    return 'compass-sidebar' +
      (this.props.isCollapsed ? ' compass-sidebar-collapsed' : ' compass-sidebar-expanded');
  }

  getToggleClasses() {
    return 'fa' +
      (this.props.isCollapsed ? ' fa-caret-right' : ' fa-caret-left');
  }

  handleCollapse() {
    if (!this.props.isCollapsed) {
      this.props.onCollapse();
      this.StatusActions ? this.StatusActions.configure({ sidebar: false }) : '';
      this.props.toggleIsCollapsed(!this.props.isCollapsed);
    }
  }

  handleExpand() {
    if (this.props.isCollapsed) {
      this.props.onCollapse();
      this.StatusActions ? this.StatusActions.configure({ sidebar: false }) : '';
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
    this.props.filterDatabases(re, null);
    this.props.toggleIsDblistExpanded(!this.props.isDblistExpanded);
    this.props.updateExpandedDblist(null, re);
  }

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      global.hadronApp.appRegistry.emit('open-create-database');
    }
  }

  _calculateRowHeight({index}) {
    console.log(`calculateRowHeight: ${index}`);
    const db = this.props.databases[index];
    let height = ROW_HEIGHT;
    if (this.props.expandedDblist[db._id]) {
      height += db.collections.length * ROW_HEIGHT + EXPANDED_WHITESPACE;
    }
    console.log(height);
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
    const expandedDB = cloneDeep(this.props.expandedDblist);
    expandedDB[_id] = !expandedDB[_id];
    this.props.changeExpandedDblist(expandedDB);
    // TODO: also call update?
    this.list.recomputeRowHeights();
  }

  renderCreateDatabaseButton() {
    if (!this.isReadonlyDistro()) {
      const tooltipText = this.props.description;
      const tooltipOptions = this.props.isWritable ? {} : {
        'data-for': TOOLTIP_IDS.CREATE_DATABASE_BUTTON,
        'data-effect': 'solid',
        'data-place': 'right',
        'data-offset': "{'right': -10}",
        'data-tip': tooltipText
      };
      let className = 'compass-sidebar-button-create-database';
      if (!this.props.isWritable) {
        className += ' compass-sidebar-button-is-disabled';
      }
      return (
        <div className="compass-sidebar-button-create-database-container" {...tooltipOptions}>
          <button
            className={className}
            title="Create Database"
            onClick={this.handleCreateDatabaseClick.bind(this, this.props.isWritable)}>
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
    console.log(`renderSidebarDatabase at ${index}`);
    const db = this.props.databases[index];
    console.log(db);
    const props = {
      isWritable: this.props.isWritable,
      description: this.props.description,
      _id: db._id,
      activeNamespace: this.props.activeNamespace,
      collections: db.collections,
      expanded: this.props.expandedDblist[db._id],
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
    // return (
    //   <AutoSizer>
    //     {({height, width}) => (
    //       <List
    //         width={width}
    //         height={height}
    //         className="compass-sidebar-autosizer-list"
    //         overScanRowCount={OVER_SCAN_COUNT}
    //         rowCount={this.props.databases.length}
    //         rowHeight={this._calculateRowHeight.bind(this)}
    //         noRowsRenderer={this.retrievingDatabases}
    //         rowRenderer={this.renderSidebarDatabase.bind(this)}
    //         ref={this._setRef.bind(this)}
    //       />
    //     )}
    //   </AutoSizer>
    // );
    return (
          <List
            width={100}
            height={30}
            className="compass-sidebar-autosizer-list"
            overScanRowCount={100}
            rowCount={this.props.databases.length}
            rowHeight={this._calculateRowHeight.bind(this)}
            noRowsRenderer={this.retrievingDatabases}
            rowRenderer={this.renderSidebarDatabase.bind(this)}
            ref={this._setRef.bind(this)}
          />
    );
  }

  render() {
    console.log(this.props);
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
                 className="compass-sidebar-search-input" placeholder="filter" onChange={this.handleFilter.bind(this)}></input>
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

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state, ownProps) => ({
  activeNamespace: state.activeNamespace,
  databases: state.databases,
  description: state.description,
  expandedDblist: state.expandedDbList,
  filterRegex: state.filterRegex,
  instance: state.instance,
  isCollapsed: state.isCollapsed,
  isDblistExpanded: state.isDblistExpanded,
  isWritable: state.isWritable,
  onCollapse: ownProps.onCollapse
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
    changeExpandedDblist,
    updateExpandedDblist,
    toggleIsDblistExpanded,
    changeFilterRegex
  },
)(Sidebar);

export default MappedSidebar;
export { Sidebar };

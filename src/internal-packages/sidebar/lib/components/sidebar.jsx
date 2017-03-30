const React = require('react');
const ReactTooltip = require('react-tooltip');
const app = require('hadron-app');
const SidebarActions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');
const { TOOLTIP_IDS } = require('./constants');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar');


class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
    this.InstanceStore = app.appRegistry.getStore('App.InstanceStore');
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
    this.state = { collapsed: false };
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

    SidebarActions.filterDatabases(re);
  }

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      this.DatabaseDDLActions.openCreateDatabaseDialog();
    }
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
        <this.StoreConnector store={this.InstanceStore}>
          <SidebarInstanceProperties
            connection={app.connection}
            activeNamespace={this.props.activeNamespace}
          />
        </this.StoreConnector>
        <div className="compass-sidebar-filter" onClick={this.handleSearchFocus.bind(this)}>
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input data-test-id="sidebar-filter-input" ref="filter" className="compass-sidebar-search-input" placeholder="filter" onChange={this.handleFilter}></input>
        </div>
        <div className="compass-sidebar-content">
          {
            this.props.databases.map(db => {
              const props = {
                _id: db._id,
                collections: db.collections,
                expanded: this.props.expanded,
                activeNamespace: this.props.activeNamespace
              };
              return (
                <SidebarDatabase key={db._id} {...props} />
              );
            })
          }
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

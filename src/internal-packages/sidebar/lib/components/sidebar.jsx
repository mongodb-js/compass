const React = require('react');
const ReactTooltip = require('react-tooltip');
const app = require('ampersand-app');
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

  getSidebarClasses() {
    return 'compass-sidebar' +
      (this.state.collapsed ? ' compass-sidebar-collapsed' : ' compass-sidebar-expanded');
  }

  getToggleClasses() {
    return 'fa' +
      (this.state.collapsed ? ' fa-forward' : ' fa-backward');
  }

  handleCollapse() {
    this.props.onCollapse();
    this.setState({ collapsed: !this.state.collapsed });
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
    const tooltipText = isWritable ?
      'Create database' :
      'Not available on a secondary node';  // TODO: Arbiter/recovering/etc
    const tooltipOptions = {
      'data-for': TOOLTIP_IDS.CREATE_DATABASE_BUTTON,
      'data-class': 'compass-sidebar-tooltip-should-be-visible',
      'data-effect': 'solid',
      'data-place': 'top',
      'data-tip': tooltipText
    };
    return (
      <button
        className="compass-sidebar-button-create-database"
        onClick={this.handleCreateDatabaseClick.bind(this, isWritable)}
        {...tooltipOptions}
      >
        <text className="plus-button">
          <i className="fa fa-plus" />
          Create Database
        </text>
        <ReactTooltip id={TOOLTIP_IDS.CREATE_DATABASE_BUTTON} />
      </button>
    );
  }

  render() {
    return (
      <div className={this.getSidebarClasses()} data-test-id="instance-sidebar">
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
        <div className="compass-sidebar-filter">
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input data-test-id="sidebar-filter-input" className="compass-sidebar-search-input" placeholder="filter" onChange={this.handleFilter}></input>
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
          {this.renderCreateDatabaseButton()}
        </div>
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

const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const InstanceStore = app.appRegistry.getStore('App.InstanceStore');
const SidebarActions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');

// const debug = require('debug')('mongodb-compass:sidebar:sidebar');


class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
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

  handleCreateDatabaseClick() {
    this.DatabaseDDLActions.openCreateDatabaseDialog();
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
        <StoreConnector store={InstanceStore}>
          <SidebarInstanceProperties
            connection={app.connection}
            activeNamespace={this.props.activeNamespace}
          />
        </StoreConnector>
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
          <button
            className="compass-sidebar-button-create-database"
            onClick={this.handleCreateDatabaseClick.bind(this)}
          >
            <text className="plus-button">
              <i className="fa fa-plus" />
              Create Database
            </text>
          </button>
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

const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const InstanceStore = app.appRegistry.getStore('App.InstanceStore');
const SidebarActions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');

const ipcRenderer = require('electron').ipcRenderer;

class Sidebar extends React.Component {

  componentDidMount() {
    ipcRenderer.on('window:sidebar-toggle-visibility',
      this.handleToggleVisibility.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeEventListener('window:sidebar-toggle-visibility',
      this.handleToggleVisibility.bind(this));
  }

  getClassName() {
    return [
      'compass-sidebar',
      this.props.visible ? 'visible' : 'hidden'
    ].join(' ');
  }

  handleFilter(event) {
    const searchString = event.target.value;

    let re;
    try {
      re = new RegExp(searchString, 'i');
    } catch (e) {
      re = /.*/;
    }

    SidebarActions.filterDatabases(re);
  }

  handleToggleVisibility() {
    SidebarActions.toggleVisibility();
  }

  render() {
    return (
      <div className={this.getClassName()}>
        <StoreConnector store={InstanceStore}>
          <SidebarInstanceProperties />
        </StoreConnector>
        <div className="compass-sidebar-filter">
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input className="compass-sidebar-search-input" onChange={this.handleFilter}></input>
        </div>
        <div className="compass-sidebar-content">
          {
            this.props.databases.map(db => {
              const props = {
                _id: db._id,
                collections: db.collections
              };
              return (
                <SidebarDatabase key={db._id} {...props} />
              );
            })
          }
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  instance: React.PropTypes.object,
  databases: React.PropTypes.array,
  visible: React.PropTypes.bool
};

module.exports = Sidebar;

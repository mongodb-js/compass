const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const InstanceStore = app.appRegistry.getStore('App.InstanceStore');
const SidebarActions = require('../actions');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');

class Sidebar extends React.Component {

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

  render() {
    return (
      <div className="compass-sidebar">
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
  databases: React.PropTypes.array
};

module.exports = Sidebar;

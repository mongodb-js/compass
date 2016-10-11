const React = require('react');
const StateMixin = require('reflux-state-mixin');

const SidebarActions = require('../actions');
const SidebarStore = require('../stores');
const SidebarDatabase = require('./sidebar-database');
const SidebarInstanceProperties = require('./sidebar-instance-properties');

const Sidebar = React.createClass({

  mixins: [ StateMixin.connect(SidebarStore) ],

  handleFilter(event) {
    const searchString = event.target.value;

    let re;
    try {
      re = new RegExp(searchString, 'i');
    } catch (e) {
      re = /.*/;
    }

    SidebarActions.filterDatabases(re);
  },

  render() {
    const instance = this.state.instance;
    const instanceProps = {
      databases: instance.databases && instance.databases.toJSON(),
      collections: instance.collections && instance.collections.toJSON(),
      build: instance.build && instance.build.toJSON(),
      hostname: instance.hostname,
      port: instance.port
    };

    return (
      <div className="compass-sidebar">
        <SidebarInstanceProperties {...instanceProps} />
        <div className="compass-sidebar-filter">
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input className="compass-sidebar-search-input" onChange={this.handleFilter}></input>
        </div>
        <div className="compass-sidebar-content">
          {
            this.state.databases.map(db => {
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
});

module.exports = Sidebar;

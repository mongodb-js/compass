const React = require('react');
const app = require('ampersand-app');

const InstanceActions = require('../../../app/actions/instance-actions');

class SidebarInstanceProperties extends React.Component {
  getHostnameAndPort() {
    const instance = this.props.instance;
    if (!instance.hostname) {
      return '';
    }

    return `${instance.hostname}.${instance.port}`;
  }

  getVersionName() {
    const instance = this.props.instance;

    if (!instance.build.version) {
      return '';
    }

    const moduleName = instance.build.enterprise_module ? 'Enterprise' : 'Community';
    return `${moduleName} version ${instance.build.version}`;
  }

  getRefreshIconClassNames() {
    const fetchingInstance = this.props.fetching;
    return 'fa ' + (fetchingInstance ? 'fa-refresh fa-spin' : 'fa-repeat');
  }

  handleRefresh() {
    InstanceActions.refreshInstance();
  }

  handleClickHostname() {
    app.navigate('/', {
      params: {
        connectionId: app.connection.getId()
      }
    });
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases.length;
    const numCollections = instance.collections.length;
    const hostnameAndPort = this.getHostnameAndPort();
    const versionName = this.getVersionName();
    return (
      <div className="compass-sidebar-properties">
      <div className="compass-sidebar-hostname" onClick={this.handleClickHostname}>{hostnameAndPort}</div>
      <div className="compass-sidebar-version">{versionName}</div>
      <div className="compass-sidebar-stats">
      <div className="compass-sidebar-property-column">
      <span className="compass-sidebar-strong-property">{numDbs}</span> DBs
      </div>
      <div className="compass-sidebar-property-column">
      <span className="compass-sidebar-strong-property">{numCollections}</span> Collections
      </div>
      <button onClick={this.handleRefresh} className="compass-sidebar-refresh-button">
      <i className={this.getRefreshIconClassNames()}></i>
      </button>
      </div>
      </div>
    );
  }
}

SidebarInstanceProperties.propTypes = {
  instance: React.PropTypes.object,
  fetching: React.PropTypes.bool
};

module.exports = SidebarInstanceProperties;

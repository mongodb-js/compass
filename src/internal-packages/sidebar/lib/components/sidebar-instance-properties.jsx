const React = require('react');
const app = require('ampersand-app');
const { NamespaceStore } = require('hadron-reflux-store');

class SidebarInstanceProperties extends React.Component {
  getHostnameAndPort() {
    const connection = this.props.connection;
    if (!connection.hostname) {
      return '';
    }

    return `${connection.hostname}:${connection.port}`;
  }

  getSshTunnelViaPort() {
    const connection = this.props.connection;
    if (connection.ssh_tunnel !== 'NONE') {
      const options = connection.ssh_tunnel_options;
      const sshHostAndPort = `via SSH tunnel ${options.host}:${options.port}`;
      return (
        <div className="compass-sidebar-instance-ssh-tunnel">
          {sshHostAndPort}
        </div>
      );
    }
    return '';
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
    const InstanceActions = app.appRegistry.getAction('App.InstanceActions');
    InstanceActions.refreshInstance();
  }

  handleClickHostname() {
    NamespaceStore.ns = '';
    this.props.onClick('');
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases.length;
    const numCollections = instance.collections.length;
    const hostnameAndPort = this.getHostnameAndPort();
    const sshTunnelViaPort = this.getSshTunnelViaPort();
    const versionName = this.getVersionName();
    return (
      <div className="compass-sidebar-properties">
        <div onClick={this.handleClickHostname.bind(this)} className={ ('' !== this.props.active) ? "compass-sidebar-instance" : "compass-sidebar-instance compass-sidebar-instance-is-active" }>
          <i className="fa fa-home compass-sidebar-instance-icon"></i>
          <div className="compass-sidebar-instance-hostname" >{hostnameAndPort}</div>
          {sshTunnelViaPort}
          <div className="compass-sidebar-instance-version">{versionName}</div>
        </div>
        <div className="compass-sidebar-stats">
          <button onClick={this.handleRefresh} className="compass-sidebar-refresh-button">
            <i className={this.getRefreshIconClassNames()}></i>
          </button>
          <div className="compass-sidebar-property-column">
            <span className="compass-sidebar-strong-property">{numDbs}</span> DBs
          </div>
          <div className="compass-sidebar-property-column">
            <span className="compass-sidebar-strong-property">{numCollections}</span> Collections
          </div>
        </div>
      </div>
    );
  }
}

SidebarInstanceProperties.propTypes = {
  connection: React.PropTypes.object,
  instance: React.PropTypes.object,
  fetching: React.PropTypes.bool,
  active: React.PropTypes.string,
  onClick: React.PropTypes.func
};

module.exports = SidebarInstanceProperties;

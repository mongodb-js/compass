const React = require('react');
const app = require('hadron-app');
const ipc = require('hadron-ipc');
const { NamespaceStore } = require('hadron-reflux-store');

class SidebarInstanceProperties extends React.Component {
  constructor(props) {
    super(props);
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
  }

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
        <div data-test-id="sidebar-ssh-tunnel-details" className="compass-sidebar-instance-ssh-tunnel">
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
    ipc.call('window:hide-collection-submenu');
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases.length;
    const numCollections = instance.collections.length;
    const hostnameAndPort = this.getHostnameAndPort();
    const sshTunnelViaPort = this.getSshTunnelViaPort();
    const versionName = this.getVersionName();
    let instanceClassName = 'compass-sidebar-instance';
    // empty string for active namespace means instance level
    if (this.props.activeNamespace === '') {
      instanceClassName += ' compass-sidebar-instance-is-active';
    }
    return (
      <div className="compass-sidebar-properties">
        <div className={instanceClassName} onClick={this.handleClickHostname}>
          <i className="fa fa-home compass-sidebar-instance-icon" />
          <div>
            <div
              data-test-id="sidebar-instance-details"
              className="compass-sidebar-instance-hostname">
              {hostnameAndPort}
            </div>
            {sshTunnelViaPort}
            <div
              data-test-id="sidebar-instance-version"
              className="compass-sidebar-instance-version">
              {versionName}
            </div>
          </div>
        </div>
        <div className="compass-sidebar-stats">
          <div className="compass-sidebar-refresh-button-container">
            <button
              onClick={this.handleRefresh}
              className="compass-sidebar-refresh-button"
              data-test-id="instance-refresh-button">
              <i className={this.getRefreshIconClassNames()}></i>
            </button>
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-db-count"
              className="compass-sidebar-strong-property">
              {numDbs}
            </span> DBs
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-collection-count"
              className="compass-sidebar-strong-property">
              {numCollections}
            </span> Collections
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
  activeNamespace: React.PropTypes.string.isRequired
};

module.exports = SidebarInstanceProperties;

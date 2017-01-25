const React = require('react');
const ReactTooltip = require('react-tooltip');
const app = require('ampersand-app');
const ipc = require('hadron-ipc');
const { NamespaceStore } = require('hadron-reflux-store');
const { TOOLTIP_IDS } = require('./constants');

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

  handleCreateDatabaseClick(isWritable) {
    if (isWritable) {
      this.DatabaseDDLActions.openCreateDatabaseDialog();
    }
  }

  render() {
    const instance = this.props.instance;
    const isWritable = app.dataService.isWritable();
    const numDbs = instance.databases.length;
    const numCollections = instance.collections.length;
    const hostnameAndPort = this.getHostnameAndPort();
    const sshTunnelViaPort = this.getSshTunnelViaPort();
    const versionName = this.getVersionName();
    const tooltipText = isWritable ?
      'Create database' :
      'Create database is not available on a secondary node';  // TODO: Arbiter/recovering/etc
    const tooltipOptions = {
      'data-for': TOOLTIP_IDS.CREATE_DATABASE_ICON,
      'data-class': 'compass-sidebar-tooltip-should-be-visible',
      'data-effect': 'solid',
      'data-place': 'right',
      'data-offset': "{'top': 1, 'left': 18}",
      'data-tip': tooltipText
    };
    let instanceClassName = 'compass-sidebar-instance';
    // empty string for active namespace means instance level
    if (this.props.activeNamespace === '') {
      instanceClassName += ' compass-sidebar-instance-is-active';
    }
    let createClassName = 'compass-sidebar-icon compass-sidebar-icon-create-database fa fa-plus-circle';
    if (!isWritable) {
      createClassName += ' compass-sidebar-icon-is-disabled';
    }
    return (
      <div className="compass-sidebar-properties">
        <div className={instanceClassName} onClick={this.handleClickHostname}>
          <i className="fa fa-home compass-sidebar-instance-icon" />
          <i
            className={createClassName}
            onClick={this.handleCreateDatabaseClick.bind(this, isWritable)}
            {...tooltipOptions}
          />
          <ReactTooltip id={TOOLTIP_IDS.CREATE_DATABASE_ICON} />
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
        <div className="compass-sidebar-stats">
          <button
            onClick={this.handleRefresh}
            className="compass-sidebar-refresh-button"
            data-test-id="instance-refresh-button">
            <i className={this.getRefreshIconClassNames()}></i>
          </button>
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

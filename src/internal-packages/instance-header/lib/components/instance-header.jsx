const React = require('react');
const InstanceHeaderActions = require('../actions');
const FontAwesome = require('react-fontawesome');
const { NamespaceStore } = require('hadron-reflux-store');
const ipc = require('hadron-ipc');
const app = require('hadron-app');

// const debug = require('debug')('mongodb-compass:instance-header');

const HOST_STRING_LENGTH = 25;

class InstanceHeaderComponent extends React.Component {

  onClick() {
    InstanceHeaderActions.toggleStatus();
  }

  returnHostnamePrefix(hostname) {
    const prefix = hostname.slice(0, -9);
    return prefix;
  }

  returnHostnameSuffix(hostname) {
    const suffix = hostname.slice(-9);
    return suffix;
  }

  returnVersionDistro() {
    let distro = this.props.versionDistro;
    return distro !== null
      ? (
        distro = distro + ' version '
      ) : 'Retrieving version';
  }

  showHostNameFull(full) {
    const flag = full || this.props.hostname.length < HOST_STRING_LENGTH;
    this.hostNamePortStr = flag ? this.props.hostname + this.props.port
      : this.returnHostnamePrefix(this.props.hostname) + '...'
        + this.returnHostnameSuffix(this.props.hostname) + this.props.port;
  }

  handleClickHostname() {
    NamespaceStore.ns = '';
    ipc.call('window:hide-collection-submenu');
  }

  renderAuthDetails(sshTunnel, sshHost, sshPort) {
    if (sshTunnel !== 'NONE') {
      return (
        <div data-test-id="instance-header-ssh" className="instance-header-ssh">
          <FontAwesome name="lock" className="instance-header-icon instance-header-icon-lock"/>
          <span className="instance-header-ssh-label">&nbsp;SSH Connection via&nbsp;&nbsp;</span>
          <span className="instance-header-ssh-hostname-prefix">{this.returnHostnamePrefix(sshHost)}</span>
          <span className="instance-header-ssh-hostname-suffix">{this.returnHostnameSuffix(sshHost)}</span>
          <span className="instance-header-ssh-port">:{sshPort}</span>
        </div>
      );
    }
    return '';
  }

  renderProcessStatus() {
    return this.props.processStatus !== ''
      ? (
        <div className="instance-header-process-status-container">
          <div className="instance-header-process-status">
            <span>{this.props.processStatus}</span>
          </div>
        </div>
      ) : '';
  }

  renderHostNamePort() {
    return (
      <div onMouseOver={this.showHostNameFull.bind(this, true)}
          onMouseOut={this.showHostNameFull.bind(this, false)}
          className="instance-header-details" data-test-id="instance-header-details">
        {this.hostNamePortStr}
      </div>
    );
  }

  /**
   * Render RefluxCapacitor.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    let instanceClassName = 'instance-header-connection-string';
    // empty string for active namespace means instance level
    if (this.props.activeNamespace === '') {
      instanceClassName += ' instance-header-connection-string-is-active';
    }

    const sshTunnel = app.connection.ssh_tunnel;
    const sshHost = app.connection.ssh_tunnel_hostname;
    const sshPort = app.connection.ssh_tunnel_options.dstPort;

    // initialise host name port string
    this.showHostNameFull(false);

    return (
      <div className="instance-header">
        <div className={instanceClassName} onClick={this.handleClickHostname}>
          <div className="instance-header-icon-container">
            <FontAwesome name="home" className="instance-header-icon instance-header-icon-home"/>
          </div>
          {this.renderHostNamePort()}
        </div>
        <div className="instance-header-status-ssh-container">
          <div className="instance-header-status-ssh">
            {/*
              TODO enable this when we support replica set status
              this.renderProcessStatus()
            */}
            {this.renderAuthDetails(sshTunnel, sshHost, sshPort)}
          </div>
        </div>
        <div className="instance-header-version-string-container">
          <div data-test-id="instance-header-version" className="instance-header-version-string">
            <span className="instance-header-version-distro">{this.returnVersionDistro()}</span>
            <span className="instance-header-version-number">{this.props.versionNumber}</span>
          </div>
        </div>
      </div>
    );
  }
}

InstanceHeaderComponent.propTypes = {
  hostname: React.PropTypes.string,
  port: React.PropTypes.number,
  processStatus: React.PropTypes.string,
  versionDistro: React.PropTypes.oneOf(['Enterprise', 'Community']),
  versionNumber: React.PropTypes.string,
  activeNamespace: React.PropTypes.string
};

InstanceHeaderComponent.defaultProps = {
};

InstanceHeaderComponent.displayName = 'InstanceHeaderComponent';

module.exports = InstanceHeaderComponent;

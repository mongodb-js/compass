const React = require('react');
const InstanceHeaderActions = require('../actions');
const FontAwesome = require('react-fontawesome');
const { NamespaceStore } = require('hadron-reflux-store');
const ipc = require('hadron-ipc');
const app = require('hadron-app');

// const debug = require('debug')('mongodb-compass:instance-header');

const HOST_STRING_LENGTH = 25;

class InstanceHeaderComponent extends React.Component {

  constructor(props) {
    super(props);

    const state = {hostStr: this.hostNamePortStr(props.hostname, props.port)};
    if (app.connection.ssh_tunnel !== 'NONE') {
      state.sshHostStr = this.hostNamePortStr(app.connection.ssh_tunnel_hostname,
        app.connection.ssh_tunnel_options.dstPort);
    }

    this.state = state;
  }

  componentWillReceiveProps(nextProps) {
    const state = {hostStr: this.hostNamePortStr(nextProps.hostname, nextProps.port)};

    if (app.connection.ssh_tunnel !== 'NONE') {
      state.sshHostStr = this.hostNamePortStr(app.connection.ssh_tunnel_hostname,
        app.connection.ssh_tunnel_options.dstPort);
    }
    this.setState(state);
  }

  onClick() {
    InstanceHeaderActions.toggleStatus();
  }

  returnHostnamePrefix(hostname) {
    const prefix = hostname.slice(0, 9);
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

  hostNamePortStr(hostname, port, showFull) {
    const str = (hostname.length < HOST_STRING_LENGTH) || showFull ?
      hostname + ':' + port
      : this.returnHostnamePrefix(hostname) + '...' + this.returnHostnameSuffix(hostname) + ':' + port;
    return str;
  }

  showHostNamePort(showFullString) {
    this.setState({hostStr: this.hostNamePortStr(this.props.hostname, this.props.port, showFullString)});
  }

  showSshHostNamePort(showFullString) {
    this.setState({sshHostStr: this.hostNamePortStr(app.connection.ssh_tunnel_hostname,
        app.connection.ssh_tunnel_options.dstPort, showFullString)});
  }

  handleClickHostname() {
    NamespaceStore.ns = '';
    ipc.call('window:hide-collection-submenu');
  }

  renderAuthDetails() {
    const view = (
      <div data-test-id="instance-header-ssh" className="instance-header-ssh"
          onMouseOver={this.showSshHostNamePort.bind(this, true)}
          onMouseOut={this.showSshHostNamePort.bind(this, false)}>
        <FontAwesome name="lock" className="instance-header-icon instance-header-icon-lock"/>
        <span className="instance-header-ssh-label">
          &nbsp;SSH Connection via&nbsp;&nbsp;{this.state.sshHostStr}
        </span>
      </div>
    );

    return app.connection.ssh_tunnel !== 'NONE' ? view : null;
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
      <div onMouseOver={this.showHostNamePort.bind(this, true)}
          onMouseOut={this.showHostNamePort.bind(this, false)}
          className="instance-header-details" data-test-id="instance-header-details">
        {this.state.hostStr}
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
            {this.renderAuthDetails()}
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

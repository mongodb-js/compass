const React = require('react');
const InstanceHeaderActions = require('../actions');
const FontAwesome = require('react-fontawesome');

// const debug = require('debug')('mongodb-compass:instance-header');

class InstanceHeaderComponent extends React.Component {

  onClick() {
    InstanceHeaderActions.toggleStatus();
  }
  /*TODO return this markup when we've enabled support for RS status*/
  renderProcessStatus() {
    return this.props.processStatus !== ''
      ? (
        <div className="instance-header-process-status-container">
          <div className="instance-header-process-status">
            <span>{this.props.processStatus}</span>
          </div>
        </div>
      ) : '' ;
  }

  returnHostnamePrefix(hostname) {
    let prefix = hostname.slice(0, -9);
    return prefix;
  }

  returnHostnameSuffix(hostname) {
    let suffix = hostname.slice(-9);
    return suffix;
  }

  returnVersionDistro() {
    let distro = this.props.versionDistro;
    return distro !== null
      ? (
        distro = distro + ' version '
      ) : 'Retrieving version'
  }

  renderAuthDetails() {
    if (app.connection.ssh_tunnel !== 'NONE') {
      const options = connection.ssh_tunnel_options;
      return (
        <div data-test-id="instance-header-ssh" className="instance-header-ssh">
          <FontAwesome name="lock" className="instance-header-icon instance-header-icon-lock"/>
          <span className="instance-header-ssh-label">&nbsp;SSH&nbsp;</span>
          <span className="instance-header-ssh-hostname-prefix">{this.returnHostnamePrefix(options.host)}</span>
          <span className="instance-header-ssh-hostname-suffix">{this.returnHostnameSuffix(options.host)}</span>
          <span className="instance-header-ssh-port">:{options.port}</span>
        </div>
      );
    }
    return '';
  }

  /**
   * Render RefluxCapacitor.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="instance-header">
        <div className="instance-header-connection-string">
          <div className="instance-header-icon-container">
            <FontAwesome name="home" className="instance-header-icon instance-header-icon-home"/>
          </div>
          <div className="instance-header-hostname-prefix">
            {this.returnHostnamePrefix(this.props.hostname)}
          </div>
          <div className="instance-header-hostname-suffix">
            {this.returnHostnameSuffix(this.props.hostname)}
          </div>
          <div className="instance-header-port">
            <span>{this.props.port}</span>
          </div>
        </div>
        <div className="instance-header-status-ssh-container">
          <div className="instance-header-status-ssh">
            {/*this.renderProcessStatus()*/}
            {this.renderAuthDetails()}
          </div>
        </div>
        <div className="instance-header-version-string-container">
          <div className="instance-header-version-string">
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
  versionNumber: React.PropTypes.string
};

InstanceHeaderComponent.defaultProps = {
};

InstanceHeaderComponent.displayName = 'InstanceHeaderComponent';

module.exports = InstanceHeaderComponent;

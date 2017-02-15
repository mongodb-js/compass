const React = require('react');
const InstanceHeaderActions = require('../actions');
const FontAwesome = require('react-fontawesome');

// const debug = require('debug')('mongodb-compass:instance-header');

class InstanceHeaderComponent extends React.Component {

  onClick() {
    InstanceHeaderActions.toggleStatus();
  }

  renderProcessStatus() {
    return this.props.processStatus !== ''
      ? (
        <div className="instance-header-process-status">{this.props.processStatus}</div>
      ) : '' ;
  }

  renderAuthDetails() {
    if (app.connection.ssh_tunnel !== 'NONE') {
      const options = connection.ssh_tunnel_options;
      return (
        <div data-test-id="instance-header-ssh" className="instance-header-ssh">
          <FontAwesome name="lock"/>
          <span>{options.host}</span>:
          <span>{options.port}</span>
        </div>
      );
    }
    // return '';
    //TODO remove the return statement below after styling!!!!!!
    return (
      <div data-test-id="instance-header-ssh" className="instance-header-ssh">
        <FontAwesome name="lock" className="instance-header-icon instance-header-icon-lock"/>
        <span>localhostsshconnection</span>:
        <span>27017</span>
      </div>
    );
  }

  isEllipsisActive(e) {
    console.info(e.offsetWidth < e.scrollWidth);
    // return (e.offsetWidth < e.scrollWidth);
  }

  renderHostnameSuffix() {
    let suffix = this.props.hostname.slice(-9);
    // return this.props.hostname ==! 'localhost' ? suffix : '';
    return suffix;
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
          <FontAwesome name="home" className="instance-header-icon instance-header-icon-home"/>
          <div className="instance-header-hostname-prefix">{this.props.hostname}</div>
          <div className="instance-header-hostname-suffix">{this.renderHostnameSuffix()}</div>
          <div className="instance-header-port">:{this.props.port}</div>
        </div>
        <div className="instance-header-status-ssh">
          {this.renderProcessStatus()}
          {this.renderAuthDetails()}
        </div>
        <div className="instance-header-version-string">
          <span className="instance-header-version-distro">{this.props.versionDistro}</span>
          &nbsp;version&nbsp;
          <span className="instance-header-version-number">{this.props.versionNumber}</span>
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

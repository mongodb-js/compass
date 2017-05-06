const React = require('react');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');

// const debug = require('debug')('mongodb-compass:server-version');

class SSHTunnelStatusComponent extends React.Component {

  /**
   * Render RefluxCapacitor.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    // don't show anything if there is no ssh tunnel
    if (!this.props.sshTunnel) {
      return null;
    }

    return (
      <div data-test-id="instance-header-ssh" className="ssh-tunnel-status"
          onMouseOver={this.props.actions.showFullHostPort}
          onMouseOut={this.props.actions.showTruncatedHostPort}>
        <FontAwesome name="lock" className="ssh-tunnel-status-icon ssh-tunnel-status-icon-lock"/>
        <span className="ssh-tunnel-status-label">
          <span className="ssh-tunnel-status-label-is-static">
            &nbsp;SSH connection via&nbsp;&nbsp;
          </span>
          {this.props.sshTunnelHostPortString}
        </span>
      </div>
    );
  }
}

SSHTunnelStatusComponent.propTypes = {
  actions: PropTypes.object,
  sshTunnel: PropTypes.bool,
  sshTunnelHostPortString: PropTypes.string
};

SSHTunnelStatusComponent.defaultProps = {
  sshTunnel: false,
  sshTunnelHostPortString: ''
};

SSHTunnelStatusComponent.displayName = 'SSHTunnelStatusComponent';

module.exports = SSHTunnelStatusComponent;

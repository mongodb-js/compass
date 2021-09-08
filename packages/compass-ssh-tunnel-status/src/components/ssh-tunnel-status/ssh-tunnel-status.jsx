import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './ssh-tunnel-status.module.less';

class SshTunnelStatus extends Component {
  static displayName = 'SshTunnelStatusComponent';

  static propTypes = {
    sshTunnel: PropTypes.bool,
    sshTunnelHostPortString: PropTypes.string
  };

  static defaultProps = {
    sshTunnel: false,
    sshTunnelHostPortString: ''
  };

  /**
   * Render SshTunnelStatus component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (!this.props.sshTunnel) {
      return null;
    }

    return (
      <div
        data-test-id="ssh-tunnel-status"
        className={classnames(styles['ssh-tunnel-status'])}>
        <div className={classnames(styles['ssh-tunnel-status-label'])}>
          SSH connection via
        </div>
        <div className={classnames(styles['ssh-tunnel-status-string'])}>
          {this.props.sshTunnelHostPortString}
        </div>
      </div>
    );
  }
}

export default SshTunnelStatus;
export { SshTunnelStatus };

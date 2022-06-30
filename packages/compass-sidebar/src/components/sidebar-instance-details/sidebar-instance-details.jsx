import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import DeploymentAwareness from '../deployment-awareness';
import ServerVersion from '../server-version';
import SshTunnelStatus from '../ssh-tunnel-status';

import styles from './sidebar-instance-details.module.less';


class SidebarInstanceDetails extends PureComponent {
  static displayName = 'SidebarInstanceDetails';
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    deploymentAwareness: PropTypes.object.isRequired,
    serverVersion: PropTypes.object.isRequired,
    sshTunnelStatus: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
  }

  renderDetails() {
    const { isExpanded, deploymentAwareness, serverVersion, sshTunnelStatus } = this.props;

    if (isExpanded) {
      return (
        <div className={styles['sidebar-instance-details-container']}>
          <DeploymentAwareness
            {...deploymentAwareness}
            />
          <ServerVersion
            {...serverVersion}
            />
          <SshTunnelStatus
            {...sshTunnelStatus}
            />
        </div>
      );
    }
  }

  // @todo: Non genuine outside container.
  render() {
    return (
      <div className={styles['sidebar-instance-details']}>
        {this.renderDetails()}
      </div>
    );
  }
}

export default SidebarInstanceDetails;

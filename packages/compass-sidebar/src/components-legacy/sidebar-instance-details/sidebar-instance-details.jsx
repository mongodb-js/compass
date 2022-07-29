import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import DeploymentAwareness from '../deployment-awareness';
import ServerVersion from '../server-version';
import SshTunnelStatus from '../ssh-tunnel-status';

import { ENTERPRISE, COMMUNITY } from '../../constants/server-version';

import styles from './sidebar-instance-details.module.less';

function getVersionDistro(isEnterprise) {
  // it is unknown until instance details are loaded
  if (typeof isEnterprise === 'undefined') {
    return '';
  }

  return isEnterprise ? ENTERPRISE : COMMUNITY;
}

class SidebarInstanceDetails extends PureComponent {
  static displayName = 'SidebarInstanceDetails';
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    instance: PropTypes.object.isRequired,
    connectionOptions: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  renderDetails() {
    const { isExpanded, instance, connectionOptions } = this.props;

    if (isExpanded) {
      return (
        <div className={styles['sidebar-instance-details-container']}>
          <DeploymentAwareness
            servers={instance.topologyDescription.servers}
            setName={instance.topologyDescription.setName}
            topologyType={instance.topologyDescription.type}
            isDataLake={instance.dataLake.isDataLake}
          />
          <ServerVersion
            versionNumber={instance.build.version}
            versionDistro={getVersionDistro(instance.build.isEnterprise)}
            isDataLake={instance.dataLake.isDataLake}
            dataLakeVersion={instance.dataLake.version}
          />
          <SshTunnelStatus {...connectionOptions} />
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

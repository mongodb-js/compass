import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SidebarInstanceStats from 'components/sidebar-instance-stats';
import SidebarInstanceDetails from 'components/sidebar-instance-details';

import classnames from 'classnames';
import styles from './sidebar-instance.less';

class SidebarInstance extends PureComponent {
  static displayName = 'SidebarInstance';
  static propTypes = {
    instance: PropTypes.object,
    isExpanded: PropTypes.bool.isRequired,
    toggleIsDetailsExpanded: PropTypes.func.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
    detailsPlugins: PropTypes.array.isRequired
  };

  render() {
    return (
      <div className={classnames(styles['sidebar-instance'])}>
        <SidebarInstanceStats
          instance={this.props.instance}
          isExpanded={this.props.isExpanded}
          toggleIsExpanded={this.props.toggleIsDetailsExpanded}
          globalAppRegistryEmit={this.props.globalAppRegistryEmit} />
        <SidebarInstanceDetails
          detailsPlugins={this.props.detailsPlugins}
          isExpanded={this.props.isExpanded} />
      </div>
    );
  }
}

export default SidebarInstance;

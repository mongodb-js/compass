import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LOADING_STATE } from 'constants/sidebar-constants';
import SidebarInstanceStats from 'components/sidebar-instance-stats';

import classnames from 'classnames';
import styles from './sidebar-instance.less';

class SidebarInstance extends PureComponent {
  static displayName = 'SidebarInstance';
  static propTypes = {
    instance: PropTypes.object,
    isExpanded: PropTypes.bool.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className={classnames(styles['compass-sidebar-instance'])}>
        <SidebarInstanceStats
          instance={this.props.instance}
          isExpanded={this.props.isExpanded}
          globalAppRegistryEmit={this.props.globalAppRegistryEmit} />
      </div>
    );
  }
}

export default SidebarInstance;

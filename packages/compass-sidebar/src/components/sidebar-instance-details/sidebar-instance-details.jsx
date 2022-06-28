import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './sidebar-instance-details.module.less';

class SidebarInstanceDetails extends PureComponent {
  static displayName = 'SidebarInstanceDetails';
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    detailsPlugins: PropTypes.array.isRequired,
  };

  constructor(props) {
    super(props);
    this.details = props.detailsPlugins.map((role, i) => {
      return <role.component key={i} />;
    });
  }

  renderPlugins() {
    if (this.props.isExpanded) {
      return (
        <div className={styles['sidebar-instance-details-container']}>
          {this.details}
        </div>
      );
    }
  }

  // @todo: Non genuine outside container.
  render() {
    return (
      <div className={styles['sidebar-instance-details']}>
        {this.renderPlugins()}
      </div>
    );
  }
}

export default SidebarInstanceDetails;

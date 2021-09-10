import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Badge from '@leafygreen-ui/badge';
import Tooltip from '@leafygreen-ui/tooltip';

import styles from './property-badge.module.less';

export default class PropertyBadge extends PureComponent {
  static displayName = 'PropertyBadge';

  static propTypes = {
    label: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
    tooltip: PropTypes.element,
    icon: PropTypes.element
  }

  renderBadge = () => {
    const space = this.props.icon ? (<span>&nbsp;</span>) : '';
    return (
      <div className={styles['property-badge']}>
        <Badge variant={this.props.variant}>{this.props.icon}{space}{this.props.label}</Badge>
      </div>
    );
  }

  render() {
    if (!this.props.tooltip) {
      return this.renderBadge();
    }

    return (<Tooltip
      align="top"
      justify="start"
      trigger={this.renderBadge()}
      triggerEvent="hover"
      darkMode
    >{this.props.tooltip}</Tooltip>);
  }
}

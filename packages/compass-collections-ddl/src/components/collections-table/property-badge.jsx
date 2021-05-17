import React, { PureComponent } from 'react';
import ReactTooltip from 'react-tooltip';
import PropTypes from 'prop-types';
import _ from 'lodash';
import styles from './property-badge.less';

export default class PropertyBadge extends PureComponent {
  static displayName = 'PropertyBadge';

  static propTypes = {
    label: PropTypes.string.isRequired,
    tooltip: PropTypes.string
  }

  renderTooltip() {
    if (!this.props.tooltip) {
      return [{}, ''];
    }

    const tooltipId = `property-badge-tooltip-${_.kebabCase(this.props.label)}`;

    return [
      {
        'data-tip': this.props.tooltip,
        'data-for': tooltipId,
        'data-effect': 'solid',
        'data-border': true
      },
      <ReactTooltip id={tooltipId} html />
    ];
  }

  render() {
    const [tooltipOptions, tooltipContents] = this.renderTooltip();
    return (
      <div {...tooltipOptions} className={styles['property-badge-shape']}>
        <span className={styles['property-badge-label']}>{this.props.label}</span>
        {tooltipContents}
      </div>
    );
  }
}

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './overview-toggler.module.less';

/**
 * Collapse text.
 */
const COLLAPSE = 'Collapse all stages';

/**
 * Expand text.
 */
const EXPAND = 'Expand all stages';

/**
 * Angle right class.
 */
const ANGLE_RIGHT = 'fa fa-angle-right';

/**
 * Angle down class.
 */
const ANGLE_DOWN = 'fa fa-angle-down';

/**
 * Collapse/Expand all pipeline stages.
 */
class OverviewToggler extends PureComponent {
  static displayName = 'OverviewToggler';

  static propTypes = {
    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired
  };

  /**
   * Render the collapser component.
   *
   * @returns {Component} The component.
   */
  render() {
    const iconClassName = this.props.isOverviewOn ? ANGLE_RIGHT : ANGLE_DOWN;
    const buttonTitle = this.props.isOverviewOn ? EXPAND : COLLAPSE;

    return (
      <div className={classnames(styles['overview-toggler'])}>
        <button
          type="button"
          title={buttonTitle}
          onClick={this.props.toggleOverview}
          className="btn btn-default btn-xs">
          <i className={iconClassName} aria-hidden />
        </button>
      </div>
    );
  }
}

export default OverviewToggler;

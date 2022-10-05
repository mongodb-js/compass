import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './stage-collapser.module.less';

/**
 * Collapse text.
 */
const COLLAPSE = 'Collapse';

/**
 * Expand text.
 */
const EXPAND = 'Expand';

/**
 * Angle right class.
 */
const ANGLE_RIGHT = 'fa fa-angle-right';

/**
 * Angle down class.
 */
const ANGLE_DOWN = 'fa fa-angle-down';

/**
 * Collapse/Expand a stage.
 */
class StageCollapser extends PureComponent {
  static displayName = 'StageCollapserComponent';

  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
  };

  /**
   * Called when the collapse icon is toggled.
   */
  onStageCollapseToggled = () => {
    this.props.stageCollapseToggled(this.props.index, this.props.isExpanded);
  };

  /**
   * Render the stage collapser component.
   *
   * @returns {Component} The component.
   */
  render() {
    const iconClassName = this.props.isExpanded ? ANGLE_DOWN : ANGLE_RIGHT;
    const buttonTitle = this.props.isExpanded ? COLLAPSE : EXPAND;
    return (
      <div className={classnames(styles['stage-collapser'])}>
        <button
          type="button"
          title={buttonTitle}
          onClick={this.onStageCollapseToggled}
          className="btn btn-default btn-xs">
          <i className={iconClassName} aria-hidden />
        </button>
      </div>
    );
  }
}

export default StageCollapser;

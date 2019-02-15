import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './input-collapser.less';

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
class InputCollapser extends PureComponent {
  static displayName = 'InputCollapserComponent';

  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired
  };

  /**
   * Render the input collapser component.
   *
   * @returns {Component} The component.
   */
  render() {
    const iconClassName = this.props.isExpanded ? ANGLE_DOWN : ANGLE_RIGHT;
    const buttonTitle = this.props.isExpanded ? COLLAPSE : EXPAND;

    return (
      <div className={classnames(styles['input-collapser'])}>
        <button
          type="button"
          title={buttonTitle}
          onClick={this.props.toggleInputDocumentsCollapsed}
          className="btn btn-default btn-xs">
          <i className={iconClassName} aria-hidden />
        </button>
      </div>
    );
  }
}

export default InputCollapser;

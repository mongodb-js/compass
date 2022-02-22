import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collation-collapser.module.less';

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
const ANGLE_RIGHT = 'fa fa-caret-right';

/**
 * Angle down class.
 */
const ANGLE_DOWN = 'fa fa-caret-down';

/**
 * Collapse/Expand a collation.
 */
class CollationCollapser extends PureComponent {
  static displayName = 'CollationCollapserComponent';

  static propTypes = {
    isCollationExpanded: PropTypes.bool.isRequired,
    collationCollapseToggled: PropTypes.func.isRequired
  };

  /**
   * Render the collation collapser component.
   *
   * @returns {Component} The component.
   */
  render() {
    const iconClassName = this.props.isCollationExpanded
      ? ANGLE_DOWN
      : ANGLE_RIGHT;
    const buttonTitle = this.props.isCollationExpanded ? COLLAPSE : EXPAND;

    return (
      <div className={classnames(styles['collation-collapser'])}>
        <button
          data-test-id="toggle-collation"
          type="button"
          title={buttonTitle}
          onClick={this.props.collationCollapseToggled}
          className="btn btn-default btn-xs">
          <i className={iconClassName} aria-hidden />
          {' '}Collation
        </button>
      </div>
    );
  }
}

export default CollationCollapser;

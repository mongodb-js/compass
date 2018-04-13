import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './off-canvas-button.less';

/**
 * Off canvas button component.
 */
class OffCanvasButton extends PureComponent {
  static displayName = 'OffCanvasButtonComponent';

  static propTypes = {
    iconClassName: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired
  }

  /**
   * Render the off canvas button component.
   *
   * @returns {Component} The component.
   */
  render() {
    const className = classnames({
      [ styles['off-canvas-button'] ]: true,
      [ styles['off-canvas-button-is-selected'] ]: this.props.isVisible
    });
    return (
      <div className={className}>
        <button
          type="button"
          title="Toggle Saved Pipelines"
          className="btn btn-default btn-xs"
          onClick={this.props.onClick}>
          <i className={this.props.iconClassName} aria-hidden />
        </button>
      </div>
    );
  }
}

export default OffCanvasButton;

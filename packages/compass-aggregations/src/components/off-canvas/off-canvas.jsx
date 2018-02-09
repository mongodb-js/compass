import OffCanvasButton from 'components/off-canvas-button';
import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './off-canvas.less';

/**
 * Off canvas componentt.
 */
class OffCanvas extends PureComponent {
  static displayName = 'OffCanvasComponent';

  static propTypes = {
    openSavedPipelines: PropTypes.func.isRequired,
    closeSavedPipelines: PropTypes.func.isRequired,
    savedPipelines: PropTypes.object.isRequired
  }

  /**
   * Render the off canvas component.
   *
   * @returns {Component} The component.
   */
  render() {
    const clickHandler = this.props.savedPipelines.isVisible
      ? this.props.closeSavedPipelines
      : this.props.openSavedPipelines;
    return (
      <div className={classnames(styles['off-canvas'])}>
        <OffCanvasButton
          onClick={clickHandler}
          iconClassName="fa fa-floppy-o"
          isVisible={this.props.savedPipelines.isVisible} />
      </div>
    );
  }
}

export default OffCanvas;

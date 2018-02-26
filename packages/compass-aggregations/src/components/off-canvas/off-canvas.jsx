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
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired
  }

  handleSavedPipelinesOpen = () => {
    this.props.getSavedPipelines();
    this.props.savedPipelinesListToggle(1);
  }

  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  }

  /**
   * Render the off canvas component.
   *
   * @returns {Component} The component.
   */
  render() {
    const clickHandler = this.props.savedPipeline.isListVisible
      ? this.handleSavedPipelinesClose
      : this.handleSavedPipelinesOpen;
    return (
      <div className={classnames(styles['off-canvas'])}>
        <OffCanvasButton
          onClick={clickHandler}
          iconClassName="fa fa-floppy-o"
          isVisible={this.props.savedPipeline.isListVisible} />
      </div>
    );
  }
}

export default OffCanvas;

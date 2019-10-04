import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PROCESS_STATUS from 'constants/process-status';

import styles from './progress-bar.less';

/**
 * The progress bar component.
 */
class ProgressBar extends PureComponent {
  static displayName = 'ProgressBarComponent';

  static propTypes = {
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    cancel: PropTypes.func.isRequired
  };

  /**
   * Get the width of the progress bar.
   *
   * @returns {String} The width as a percentage.
   */
  getWidth() {
    const width = this.props.progress;
    return `${width}%`;
  }

  /**
   * Get the class name for the bar.
   *
   * @returns {String} The class name.
   */
  getBarClassName() {
    return classnames({
      [styles['progress-bar-bar']]: true,
      [styles['progress-bar-bar-is-started']]:
        this.props.status === PROCESS_STATUS.STARTED,
      [styles['progress-bar-bar-is-canceled']]:
        this.props.status === PROCESS_STATUS.CANCELED,
      [styles['progress-bar-bar-is-completed']]:
        this.props.status === PROCESS_STATUS.COMPLETED,
      [styles['progress-bar-bar-is-failed']]:
        this.props.status === PROCESS_STATUS.FAILED
    });
  }

  /**
   * Get the class name for the wrapper.
   *
   * @returns {String} The class name.
   */
  getWrapperClassName() {
    return classnames({
      [styles['progress-bar']]: true,
      [styles['progress-bar-is-started']]:
        this.props.status === PROCESS_STATUS.STARTED
    });
  }

  /**
   * Handle clicking the cancel button.
   */
  handleCancel = () => {
    this.props.cancel();
  };

  /**
   * Render the cancel button if still in progress.
   *
   * @return {React.Component} The component.
   */
  renderCancelButton() {
    if (this.props.status === PROCESS_STATUS.STARTED) {
      return (
        <div
          className={classnames(styles['progress-bar-cancel'])}
          onClick={this.handleCancel}
        >
          Cancel
        </div>
      );
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={this.getWrapperClassName()}>
        <div
          className={this.getBarClassName()}
          style={{ width: this.getWidth() }}
        >
          {this.props.message}
        </div>
        {this.renderCancelButton()}
      </div>
    );
  }
}

export default ProgressBar;

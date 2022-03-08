import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  COMPLETED,
  COMPLETED_WITH_ERRORS,
  FINISHED_STATUSES,
  STARTED,
  CANCELED,
  FAILED,
  UNSPECIFIED
} from '../../constants/process-status';

import styles from './progress-bar.module.less';
import createStyler from '../../utils/styler.js';
import formatNumber from '../../utils/format-number.js';

const style = createStyler(styles, 'progress-bar');

function toPercentage(num, total) {
  return `${Math.min(Math.max(num / total * 100, 0), 100).toFixed(3)}%`;
}

/**
 * The progress bar component.
 */
class ProgressBar extends PureComponent {
  static displayName = 'ProgressBarComponent';

  static propTypes = {
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    docsTotal: PropTypes.number,
    docsProcessed: PropTypes.number,
    docsWritten: PropTypes.number,
    cancel: PropTypes.func,
    progressLabel: PropTypes.func,
    progressTitle: PropTypes.func,
    withErrors: PropTypes.bool
  };

  static defaultProps = {
    progressLabel(formattedWritten, formattedTotal) {
      return `${formattedWritten}\u00A0/\u00A0${formattedTotal}`;
    },
    progressTitle(formattedWritten, formattedTotal) {
      return `${formattedWritten} documents out of ${formattedTotal}`;
    }
  }

  /**
   * Get the class name for the bar.
   *
   * @param {boolean} secondary
   * @returns {String} The class name.
   */
  getBarClassName(secondary = false) {
    const { status, withErrors } = this.props;

    return classnames({
      [style('bar')]: true,
      [style('bar-is-canceled')]: status === CANCELED,
      [style('bar-is-completed')]: status === COMPLETED,
      [style('bar-is-failed')]: status === FAILED,
      [style('bar-is-with-errors')]:
        (!FINISHED_STATUSES.includes(status) && withErrors) ||
        status === COMPLETED_WITH_ERRORS,
      [style('bar-is-secondary')]: secondary,
    });
  }

  getMessageClassName() {
    return classnames({
      [style('status-message')]: true,
      [style('status-message-is-failed')]: this.props.status === FAILED
    });
  }

  getCancelButton() {
    if (this.props.status !== STARTED) {
      return null;
    }

    return (
      <button
        className={classnames(style('status-message-cancel'))}
        onClick={this.handleCancel}
      >
        Stop
      </button>
    );
  }

  /**
   * Cancel import or export event.
   * @param {Object} evt: click event
   */
  handleCancel = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    this.props.cancel();
  };

  renderStats() {
    const { docsTotal, docsWritten, progressLabel, progressTitle } = this.props;

    const formattedWritten = formatNumber(docsWritten);
    const formattedTotal = formatNumber(docsTotal);

    return (
      <p
        className={style('status-stats')}
        title={progressTitle(formattedWritten, formattedTotal)}
      >
        {progressLabel(formattedWritten, formattedTotal)}
      </p>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const {
      message,
      status,
      docsProcessed,
      docsTotal,
      docsWritten,
    } = this.props;

    if (status === UNSPECIFIED) {
      return null;
    }

    return (
      <div className={style('chart-wrapper')}>
        <div className={style()}>
          <div
            className={this.getBarClassName()}
            style={{ width: toPercentage(docsWritten, docsTotal) }}
          />
          {Boolean(docsProcessed) && (
            <div
              className={this.getBarClassName(true)}
              style={{ width: toPercentage(docsProcessed, docsTotal) }}
            />
          )}
        </div>
        <div className={styles['progress-bar-status']}>
          <p className={this.getMessageClassName()}>
            {message}
            {this.getCancelButton()}
          </p>
          {this.renderStats()}
        </div>
      </div>
    );
  }
}

export default ProgressBar;

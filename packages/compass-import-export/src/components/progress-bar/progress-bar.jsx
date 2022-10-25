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
  UNSPECIFIED,
} from '../../constants/process-status';

import styles from './progress-bar.module.less';
import createStyler from '../../utils/styler';
import formatNumber from '../../utils/format-number';

const style = createStyler(styles, 'progress-bar');

function toPercentage(num, total) {
  return `${Math.min(Math.max((num / total) * 100, 0), 100).toFixed(3)}%`;
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
    withErrors: PropTypes.bool,
  };

  static defaultProps = {
    progressLabel(written, total) {
      if (!total) {
        return formatNumber(written);
      }
      return `${formatNumber(written)}\u00A0/\u00A0${formatNumber(total)}`;
    },
    progressTitle(written, total) {
      if (!total) {
        return `${formatNumber(written)} documents`;
      }
      return `${formatNumber(written)} documents out of ${formatNumber(total)}`;
    },
  };

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
      [style('status-message-is-failed')]: this.props.status === FAILED,
    });
  }

  getCancelButton() {
    if (this.props.status !== STARTED) {
      return null;
    }

    return (
      <button
        type="button"
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
    const title = progressTitle(docsWritten, docsTotal);
    const label = progressLabel(docsWritten, docsTotal);
    return (
      <p className={style('status-stats')} title={title}>
        {label}
      </p>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const { message, status, docsProcessed, docsTotal, docsWritten } =
      this.props;

    if (status === UNSPECIFIED) {
      return null;
    }

    return (
      <div className={style('chart-wrapper')}>
        {!isNaN(docsTotal) && (
          <div className={style()}>
            <div
              className={this.getBarClassName()}
              style={{ width: toPercentage(docsWritten, docsTotal) }}
            />
            {!isNaN(docsProcessed) && (
              <div
                className={this.getBarClassName(true)}
                style={{ width: toPercentage(docsProcessed, docsTotal) }}
              />
            )}
          </div>
        )}

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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import isEmpty from 'lodash.isempty';

import styles from './status.less';

const STATUS_ID = 'statusbar';

/**
 * The status component displays various items when the user is waiting for
 * something to complete.
 */
class Status extends Component {
  static displayName = 'StatusComponent';

  static propTypes = {
    visible: PropTypes.bool,
    progressbar: PropTypes.bool,
    progress: PropTypes.number,
    message: PropTypes.string,
    animation: PropTypes.bool,
    sidebar: PropTypes.bool,
    subview: PropTypes.any
  };

  /**
   * Render Status component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    let statusSubview = null;
    if (this.props.subview) {
      const SubView = this.props.subview;
      statusSubview = <SubView {...this.props} />;
    }

    const statusClasses = {};
    statusClasses[styles.status] = true;
    statusClasses[styles['status-is-visible']] = this.props.visible;

    const progressClasses = {};
    progressClasses[styles.progress] = true;
    progressClasses[styles['progress-is-visible']] = this.props.progressbar;

    const progressBarClasses = {};
    progressBarClasses[styles['progress-bar']] = true;
    progressBarClasses[styles['progress-bar-is-striped']] = true;
    progressBarClasses[styles['progress-bar-is-active']] = true;

    const progressBarWidth = {
      width: `${this.props.progress}%`
    };

    const sidebarClasses = {};
    sidebarClasses[styles.sidebar] = true;
    sidebarClasses[styles['sidebar-is-visible']] = this.props.sidebar;

    const messageClasses = {};
    messageClasses[styles.message] = true;
    messageClasses[styles['message-has-sidebar']] = this.props.sidebar;
    messageClasses[styles['message-is-centered']] = true;

    const messageTextClasses = {};
    messageTextClasses[styles['message-text']] = true;
    messageTextClasses[styles['message-text-is-visible']] = !isEmpty(this.props.message);

    const spinnerClasses = {};
    spinnerClasses[styles.spinner] = true;
    spinnerClasses[styles['spinner-is-visible']] = this.props.animation;

    return (
      <div id={STATUS_ID} className={classnames(statusClasses)}>
        <div className={classnames(progressClasses)}>
          <div className={classnames(progressBarClasses)} style={progressBarWidth}>
          </div>
        </div>
        <div className={classnames(sidebarClasses)}>
        </div>
        <div className={classnames(messageClasses)}>
          <p className={classnames(messageTextClasses)}>
            {this.props.message}
          </p>
          <div className={classnames(spinnerClasses)}>
            <div className={classnames(styles['spinner-rect'])}></div>
            <div className={classnames(styles['spinner-rect-delay-1'])}></div>
            <div className={classnames(styles['spinner-rect-delay-2'])}></div>
            <div className={classnames(styles['spinner-rect-delay-3'])}></div>
            <div className={classnames(styles['spinner-rect-delay-4'])}></div>
          </div>
          <div className={classnames(styles.subview)}>
            {statusSubview}
          </div>
        </div>
      </div>
    );
  }
}

export default Status;
export { Status };

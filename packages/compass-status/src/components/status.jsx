import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './status.less';

const STATUS_ID = 'statusbar';

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
    const visible = this.props.visible ? '' : 'hidden';
    const progressBarWidth = this.props.progress;
    const progressBarHeight = 4;
    const outerBarStyle = {
      display: this.props.progressbar ? 'block' : 'none',
      height: progressBarHeight
    };
    const innerBarStyle = {
      width: `${progressBarWidth}%`
    };
    const messageStyle = {
      visibility: this.props.message !== '' ? 'visible' : 'hidden'
    };
    const animationStyle = {
      visibility: this.props.animation ? 'visible' : 'hidden'
    };
    const sidebarStyle = {
      display: this.props.sidebar ? 'block' : 'none'
    };

    let statusSubview = null;
    if (this.props.subview) {
      const SubView = this.props.subview;
      statusSubview = <SubView {...this.props} />;
    }

    const progressBarStyles = {
      'progress-bar': true,
      'progress-bar-striped': true,
      'active': true
    };

    const messageStyles = {
      'with-sidebar': true,
      'centered': true
    };

    return (
      <div id={STATUS_ID} className={classnames(styles.root)}> style={visible}>
        <div className={classnames(styles.progress)} style={outerBarStyle}>
          <div className={classnames(progressBarStyles)} style={innerBarStyle}>
          </div>
        </div>
        <div className={classnames(styles.sidebar)} style={sidebarStyle}>
        </div>
        <ul className={classnames(messageStyles)}>
          <li>
            <p className={classnames(styles.message)} style={messageStyle}>
              {this.props.message}
            </p>
            <div className={classnames(styles.spinner)} style={animationStyle}>
              <div className={classnames(styles.rect1)}></div>
              <div className={classnames(styles.rect2)}></div>
              <div className={classnames(styles.rect3)}></div>
              <div className={classnames(styles.rect4)}></div>
              <div className={classnames(styles.rect5)}></div>
            </div>
            <div className={classnames(styles.subview)}>
              {statusSubview}
            </div>
          </li>
        </ul>
      </div>
    );
  }
}

export default Status;
export { Status };

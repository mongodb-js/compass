import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './loading-overlay.module.less';

/**
 * The loading overlay component.
 */
class LoadingOverlay extends PureComponent {
  static displayName = 'LoadingOverlay';

  static propTypes = {
    text: PropTypes.string.isRequired
  }

  /**
   * Renders the loading overlay.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles['loading-overlay']}>
        <div className={styles['loading-overlay-box']}>
          <i className="fa fa-circle-o-notch fa-spin" aria-hidden />
          <div className={styles['loading-overlay-box-text']}>
            {this.props.text}
          </div>
        </div>
      </div>
    );
  }
}

export default LoadingOverlay;

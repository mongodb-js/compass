import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './loading-overlay.module.less';
import { SpinLoader } from '@mongodb-js/compass-components';

/**
 * The loading overlay component.
 */
class LoadingOverlay extends PureComponent {
  static displayName = 'LoadingOverlay';

  static propTypes = {
    text: PropTypes.string.isRequired,
  };

  /**
   * Renders the loading overlay.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['loading-overlay'])}>
        <div className={classnames(styles['loading-overlay-box'])}>
          <SpinLoader />
          <div className={classnames(styles['loading-overlay-box-text'])}>
            {this.props.text}
          </div>
        </div>
      </div>
    );
  }
}

export default LoadingOverlay;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ENTERPRISE, COMMUNITY } from 'constants/server-version';

import styles from './server-version.less';

class ServerVersion extends Component {
  static displayName = 'ServerVersionComponent';

  static propTypes = {
    versionNumber: PropTypes.string,
    versionDistro: PropTypes.oneOf(['', ENTERPRISE, COMMUNITY]),
    isDataLake: PropTypes.bool,
    dataLakeVersion: PropTypes.string
  };

  static defaultProps = {
    versionNumber: '',
    versionDistro: ''
  };

  getVersion() {
    if (this.props.isDataLake) {
      return `Atlas Data Lake ${this.props.dataLakeVersion ? this.props.dataLakeVersion : ''}`;
    }
    return `MongoDB ${this.props.versionNumber} ${this.props.versionDistro}`;
  }

  /**
   * Render ServerVersion component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.props.versionNumber === '' || this.props.versionDistro === '') {
      return null;
    }
    return (
      <div className={classnames(styles['server-version'])} data-test-id="server-version">
        <div className={classnames(styles['server-version-edition'])}>
          EDITION
        </div>
        <div className={classnames(styles['server-version-text'])}>
          {this.getVersion()}
        </div>
      </div>
    );
  }
}

export default ServerVersion;
export { ServerVersion };

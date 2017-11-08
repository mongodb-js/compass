import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ENTERPRISE, COMMUNITY } from 'constants/server-version';

import styles from './server-version.less';

class ServerVersion extends Component {
  static displayName = 'ServerVersionComponent';

  static propTypes = {
    versionNumber: PropTypes.string,
    versionDistro: PropTypes.oneOf(['', ENTERPRISE, COMMUNITY])
  };

  static defaultProps = {
    versionNumber: '',
    versionDistro: ''
  };

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
        MongoDB {this.props.versionNumber} {this.props.versionDistro}
      </div>
    );
  }
}

export default ServerVersion;
export { ServerVersion };

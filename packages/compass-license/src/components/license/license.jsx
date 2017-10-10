import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './license.less';

class License extends Component {
  static displayName = 'LicenseComponent';

  /**
   * Render License component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
        <h2 className={classnames(styles.title)}>License Plugin</h2>
      </div>
    );
  }
}

export default License;
export { License };

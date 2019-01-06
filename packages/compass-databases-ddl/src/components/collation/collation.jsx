import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './collation.less';

/**
 * The collation component.
 */
class Collation extends PureComponent {
  static displayName = 'CollationComponent';

  /**
   * Render Collation component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.collation)}>
      </div>
    );
  }
}

export default Collation;

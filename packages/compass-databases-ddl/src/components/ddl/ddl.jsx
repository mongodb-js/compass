import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './ddl.less';

class Ddl extends Component {
  static displayName = 'DdlComponent';

  /**
   * Render Ddl component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
        <h2 className={classnames(styles.title)}>Ddl Plugin</h2>
        <p>Compass DDL Plugin</p>
      </div>
    );
  }
}

export default Ddl;

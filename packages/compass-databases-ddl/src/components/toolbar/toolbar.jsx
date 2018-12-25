import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './toolbar.less';

/**
 * The toolbar component.
 */
class Toolbar extends Component {
  static displayName = 'ToolbarComponent';

  /**
   * Render Toolbar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.toolbar)}>
      </div>
    );
  }
}

export default Toolbar;

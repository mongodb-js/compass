import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './toolbar.less';

/**
 * The toolbar component.
 */
class Toolbar extends PureComponent {
  static displayName = 'ToolbarComponent';

  /**
   * Renders the toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.toolbar)}>
      </div>
    );
  }
}

export default Toolbar;

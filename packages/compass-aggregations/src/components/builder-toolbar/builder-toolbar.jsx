import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './builder-toolbar.less';

/**
 * The builder toolbar component.
 */
class BuilderToolbar extends PureComponent {
  static displayName = 'BuilderToolbarComponent';

  /**
   * Renders the builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['builder-toolbar'])}>
      </div>
    );
  }
}

export default BuilderToolbar;

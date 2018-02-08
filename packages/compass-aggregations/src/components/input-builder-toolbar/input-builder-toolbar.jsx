import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './input-builder-toolbar.less';

/**
 * The input builder toolbar component.
 */
class InputBuilderToolbar extends PureComponent {
  static displayName = 'InputBuilderToolbar';

  /**
   * Renders the input builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-builder-toolbar'])}>
      </div>
    );
  }
}

export default InputBuilderToolbar;

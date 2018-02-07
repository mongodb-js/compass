import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './preview-toolbar.less';

/**
 * The preview toolbar component.
 */
class PreviewToolbar extends PureComponent {
  static displayName = 'PreviewToolbarComponent';

  /**
   * Renders the preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['preview-toolbar'])}>
      </div>
    );
  }
}

export default PreviewToolbar;

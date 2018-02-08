import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './input-preview-toolbar.less';

/**
 * The static text.
 */
const TEXT = 'Preview of Input Documents';

/**
 * The input preview toolbar component.
 */
class InputPreviewToolbar extends PureComponent {
  static displayName = 'InputPreviewToolbar';

  /**
   * Renders the input preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-preview-toolbar'])}>
        <div className={classnames(styles['input-preview-toolbar-text'])}>
          {TEXT}
        </div>
      </div>
    );
  }
}

export default InputPreviewToolbar;

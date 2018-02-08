import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './input-preview.less';

/**
 * The input preview component.
 */
class InputPreview extends PureComponent {
  static displayName = 'InputPreview';

  /**
   * Renders the input preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-preview'])}>
      </div>
    );
  }
}

export default InputPreview;

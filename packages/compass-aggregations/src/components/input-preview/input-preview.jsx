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
    const iconClassName = classnames({
      'fa': true,
      'fa-angle-double-right': true,
      [ styles['input-preview-arrow'] ]: true
    });
    return (
      <div className={classnames(styles['input-preview'])}>
        <i className={iconClassName} aria-hidden />
      </div>
    );
  }
}

export default InputPreview;

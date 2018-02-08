import React, { PureComponent } from 'react';
import classnames from 'classnames';
import InputBuilderToolbar from 'components/input-builder-toolbar';
import InputPreviewToolbar from 'components/input-preview-toolbar';

import styles from './input-toolbar.less';

/**
 * The input toolbar component.
 */
class InputToolbar extends PureComponent {
  static displayName = 'InputToolbar';

  /**
   * Renders the input toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-toolbar'])}>
        <InputBuilderToolbar {...this.props} />
        <InputPreviewToolbar {...this.props} />
      </div>
    );
  }
}

export default InputToolbar;

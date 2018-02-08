import React, { PureComponent } from 'react';
import classnames from 'classnames';
import InputBuilder from 'components/input-builder';
import InputPreview from 'components/input-preview';

import styles from './input-workspace.less';

/**
 * The input workspace component.
 */
class InputWorkspace extends PureComponent {
  static displayName = 'InputWorkspace';

  /**
   * Renders the input workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-workspace'])}>
        <InputBuilder {...this.props} />
        <InputPreview {...this.props} />
      </div>
    );
  }
}

export default InputWorkspace;

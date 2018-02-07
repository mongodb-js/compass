import React, { PureComponent } from 'react';
import classnames from 'classnames';
import StageBuilderToolbar from 'components/stage-builder-toolbar';
import StagePreviewToolbar from 'components/stage-preview-toolbar';

import styles from './stage-toolbar.less';

/**
 * The stage toolbar component.
 */
class StageToolbar extends PureComponent {
  static displayName = 'StageToolbar';

  /**
   * Renders the stage toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-toolbar'])}>
        <StageBuilderToolbar {...this.props} />
        <StagePreviewToolbar {...this.props} />
      </div>
    );
  }
}

export default StageToolbar;

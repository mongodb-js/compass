import React, { PureComponent } from 'react';
import classnames from 'classnames';
import StageEditor from 'components/stage-editor';
import StagePreview from 'components/stage-preview';

import styles from './stage-workspace.less';

/**
 * The stage workspace component.
 */
class StageWorkspace extends PureComponent {
  static displayName = 'StageWorkspace';

  /**
   * Renders the stage workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-workspace'])}>
        <StageEditor {...this.props} />
        <StagePreview {...this.props} />
      </div>
    );
  }
}

export default StageWorkspace;

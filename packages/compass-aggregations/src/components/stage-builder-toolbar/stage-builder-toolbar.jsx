import React, { PureComponent } from 'react';
import classnames from 'classnames';
import DeleteStage from 'components/delete-stage';
import ToggleStage from 'components/toggle-stage';
import StageGrabber from 'components/stage-grabber';
import StageCollapser from 'components/stage-collapser';
import StageOperatorSelect from 'components/stage-operator-select';

import styles from './stage-builder-toolbar.less';

/**
 * The stage builder toolbar component.
 */
class StageBuilderToolbar extends PureComponent {
  static displayName = 'StageBuilderToolbar';

  /**
   * Renders the stage builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-builder-toolbar'])}>
        <StageGrabber />
        <StageCollapser {...this.props} />
        <StageOperatorSelect {...this.props } />
        <ToggleStage {...this.props} />
        <DeleteStage {...this.props} />
      </div>
    );
  }
}

export default StageBuilderToolbar;

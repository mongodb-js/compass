import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageBuilderToolbar from 'components/stage-builder-toolbar';
import StagePreviewToolbar from 'components/stage-preview-toolbar';

import styles from './stage-toolbar.less';

/**
 * The stage toolbar component.
 */
class StageToolbar extends PureComponent {
  static displayName = 'StageToolbar';
  static propTypes = {
    stage: PropTypes.object.isRequired
  }

  /**
   * Renders the stage toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const valid = this.props.stage.isValid ? 'stage-toolbar' : 'stage-toolbar-invalid';
    return (
      <div className={classnames(styles[valid])}>
        <StageBuilderToolbar {...this.props} />
        <StagePreviewToolbar
          isEnabled={this.props.stage.isEnabled}
          stageOperator={this.props.stage.stageOperator} />
      </div>
    );
  }
}

export default StageToolbar;

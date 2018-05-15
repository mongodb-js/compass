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
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired
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
        <StageBuilderToolbar
          stage={this.props.stage}
          index={this.props.index}
          stageOperatorSelected={this.props.stageOperatorSelected}
          stageCollapseToggled={this.props.stageCollapseToggled}
          stageToggled={this.props.stageToggled}
          runStage={this.props.runStage}
          openLink={this.props.openLink}
          stageDeleted={this.props.stageDeleted}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion} />
        <StagePreviewToolbar
          isEnabled={this.props.stage.isEnabled}
          isValid={this.props.stage.isValid}
          stageOperator={this.props.stage.stageOperator}
          stageValue={this.props.stage.stage} />
      </div>
    );
  }
}

export default StageToolbar;

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
    stage: PropTypes.string.isRequired,
    error: PropTypes.string,
    isExpanded: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    previewCount: PropTypes.number.isRequired
  }

  /**
   * Renders the stage toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const errored = this.props.error ? 'stage-toolbar-errored' : 'stage-toolbar';
    return (
      <div className={classnames(styles[errored])}>
        <StageBuilderToolbar
          isExpanded={this.props.isExpanded}
          isEnabled={this.props.isEnabled}
          stageOperator={this.props.stageOperator}
          index={this.props.index}
          stageOperatorSelected={this.props.stageOperatorSelected}
          stageCollapseToggled={this.props.stageCollapseToggled}
          stageToggled={this.props.stageToggled}
          runStage={this.props.runStage}
          openLink={this.props.openLink}
          isCommenting={this.props.isCommenting}
          stageAddedAfter={this.props.stageAddedAfter}
          stageDeleted={this.props.stageDeleted}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion} />
        <StagePreviewToolbar
          isEnabled={this.props.isEnabled}
          isValid={this.props.isValid}
          stageOperator={this.props.stageOperator}
          stageValue={this.props.stage}
          count={this.props.previewCount} />
      </div>
    );
  }
}

export default StageToolbar;

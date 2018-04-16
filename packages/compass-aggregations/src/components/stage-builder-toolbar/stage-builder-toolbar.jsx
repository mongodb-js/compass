import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
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
  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired
  }

  /**
   * Renders the stage builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-builder-toolbar'])}>
        <StageGrabber />
        <StageCollapser
          stage={this.props.stage}
          index={this.props.index}
          setIsModified={this.props.setIsModified}
          stageCollapseToggled={this.props.stageCollapseToggled} />
        <StageOperatorSelect
          stageOperator={this.props.stage.stageOperator}
          index={this.props.index}
          stageOperatorSelected={this.props.stageOperatorSelected}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion} />
        <ToggleStage
          stage={this.props.stage}
          index={this.props.index}
          runStage={this.props.runStage}
          setIsModified={this.props.setIsModified}
          stageToggled={this.props.stageToggled} />
        <DeleteStage
          stage={this.props.stage}
          index={this.props.index}
          setIsModified={this.props.setIsModified}
          stageDeleted={this.props.stageDeleted} />
      </div>
    );
  }
}

export default StageBuilderToolbar;

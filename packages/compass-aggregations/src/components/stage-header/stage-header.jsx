import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import DeleteStage from 'components/delete-stage';
import ToggleStage from 'components/toggle-stage';
import StageGrabber from 'components/stage-grabber';
import StageCollapser from 'components/stage-collapser';
import StageOperatorSelect from 'components/stage-operator-select';

import styles from './stage-header.less';

/**
 * Display the header on the stage card.
 */
class StageHeader extends PureComponent {
  static displayName = 'StageHeaderComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    runStage: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-header'])}>
        <StageGrabber />
        <StageCollapser
          stage={this.props.stage}
          index={this.props.index}
          stageCollapseToggled={this.props.stageCollapseToggled} />
        <StageOperatorSelect
          stage={this.props.stage}
          index={this.props.index}
          stageOperatorSelected={this.props.stageOperatorSelected} />
        <ToggleStage
          stage={this.props.stage}
          index={this.props.index}
          runStage={this.props.runStage}
          stageToggled={this.props.stageToggled} />
        <DeleteStage
          stage={this.props.stage}
          index={this.props.index}
          stageDeleted={this.props.stageDeleted} />
      </div>
    );
  }
}

export default StageHeader;

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import DeleteStage from './delete-stage';
import AddAfterStage from './add-after-stage';
import ToggleStage from './toggle-stage';
import StageGrabber from './stage-grabber';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import { Tooltip, Body, Icon } from '@mongodb-js/compass-components';

import styles from './stage-editor-toolbar.module.less';

const STAGE_TOOLTIP_MESSAGE = {
  $out: 'The $out operator will cause the pipeline to persist the results to the specified location (collection, S3, or Atlas). If the collection exists it will be replaced.',
  $merge: 'The $merge operator will cause the pipeline to persist the results to the specified location.'
};

const STAGES_WITH_TOOLTIP = Object.keys(STAGE_TOOLTIP_MESSAGE);

function StageEditorOutMergeTooltip({ stageOperator }) {
  if (STAGES_WITH_TOOLTIP.includes(stageOperator)) {
    return (
      <Tooltip
        trigger={({ children, ...props }) => (
          <span {...props} className={styles['tooltip-icon']}>
            {children}
            <Icon glyph="InfoWithCircle" />
          </span>
        )}
      >
        <Body>{STAGE_TOOLTIP_MESSAGE[stageOperator]}</Body>
      </Tooltip>
    );
  }
  return null;
}

StageEditorOutMergeTooltip.propTypes = {
  stageOperator: PropTypes.string.isRequired
};

/**
 * The stage editor toolbar component.
 */
class StageEditorToolbar extends PureComponent {
  static displayName = 'StageEditorToolbar';
  static propTypes = {
    env: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string,
    error: PropTypes.string,
    isExpanded: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    runStage: PropTypes.func.isRequired,
    isAutoPreviewing: PropTypes.bool,
  };

  /**
   * Renders the stage editor toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-editor-toolbar'], {
        [styles['stage-editor-toolbar-errored']]: this.props.error
      })}>
        <StageGrabber />
        <StageCollapser
          isExpanded={this.props.isExpanded}
          index={this.props.index}
          setIsModified={this.props.setIsModified}
          stageCollapseToggled={this.props.stageCollapseToggled}
        />
        <StageOperatorSelect
          env={this.props.env}
          isTimeSeries={this.props.isTimeSeries}
          isReadonly={this.props.isReadonly}
          sourceName={this.props.sourceName}
          stageOperator={this.props.stageOperator}
          index={this.props.index}
          isEnabled={this.props.isEnabled}
          isCommenting={this.props.isCommenting}
          stageOperatorSelected={this.props.stageOperatorSelected}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion}
        />
        <ToggleStage
          index={this.props.index}
          isEnabled={this.props.isEnabled}
          runStage={this.props.runStage}
          setIsModified={this.props.setIsModified}
          stageToggled={this.props.stageToggled}
        />
        <div className={styles['stage-editor-toolbar-right']}>
          {!this.props.isAutoPreviewing && (
            <StageEditorOutMergeTooltip
              stageOperator={this.props.stageOperator}
            ></StageEditorOutMergeTooltip>
          )}
          <DeleteStage
            index={this.props.index}
            runStage={this.props.runStage}
            setIsModified={this.props.setIsModified}
            stageDeleted={this.props.stageDeleted}
          />
          <AddAfterStage
            index={this.props.index}
            stageAddedAfter={this.props.stageAddedAfter}
          />
        </div>
      </div>
    );
  }
}

export default StageEditorToolbar;

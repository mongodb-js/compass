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
import { connect } from 'react-redux';

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
export class StageEditorToolbar extends PureComponent {
  static propTypes = {
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    isAutoPreviewing: PropTypes.bool,
    hasServerError: PropTypes.bool
  };

  /**
   * Renders the stage editor toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-editor-toolbar'], {
        [styles['stage-editor-toolbar-errored']]: this.props.hasServerError
      })}>
        <StageGrabber />
        <StageCollapser index={this.props.index} />
        <StageOperatorSelect index={this.props.index} />
        <ToggleStage index={this.props.index} />
        <div className={styles['stage-editor-toolbar-right']}>
          {!this.props.isAutoPreviewing && (
            <StageEditorOutMergeTooltip
              stageOperator={this.props.stageOperator}
            ></StageEditorOutMergeTooltip>
          )}
          <DeleteStage index={this.props.index} />
          <AddAfterStage index={this.props.index} />
        </div>
      </div>
    );
  }
}

export default connect((state, ownProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  return {
    stageOperator: stage.stageOperator,
    isAutoPreviewing: state.autoPreview,
    hasServerError: !!stage.serverError,
  };
}, null)(StageEditorToolbar);

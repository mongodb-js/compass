import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { sortableHandle } from 'react-sortable-hoc';

import ResizeHandle from '../resize-handle/resize-handle';
import StageEditorToolbar from '../stage-editor-toolbar';
import StageEditor from '../stage-editor';
import StagePreview from '../stage-preview';
import StagePreviewToolbar from '../stage-preview-toolbar';

import styles from './stage.module.less';
import { connect } from 'react-redux';
import {
  changeStageOperator,
  changeStageValue,
  changeStageCollapsed,
  changeStageDisabled,
  addStage,
  removeStage
} from '../../modules/pipeline-builder/stage-editor';
import { openLink } from '../../modules/link';

const DragHandleToolbar = sortableHandle((props) => {
  return <StageEditorToolbar {...props}></StageEditorToolbar>;
});

const resizeableDirections = {
  top: false,
  right: true,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false
};

/**
 * The default CSS opacity for the HTMLElement
 * when not dragging or enabled.
 * @constant {Number}
 */
const DEFAULT_OPACITY = 0.6;

/**
 * Display a single stage in the aggregation pipeline.
 *
 * Decorators added for giving the component drag/drop behaviour.
 */
class Stage extends Component {
  static displayName = 'StageComponent';

  static propTypes = {
    env: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string,
    stage: PropTypes.string.isRequired,
    stageOperator: PropTypes.string,
    error: PropTypes.string,
    syntaxError: PropTypes.string,
    isValid: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isComplete: PropTypes.bool.isRequired,
    // Can be undefined on the initial render
    isMissingAtlasOnlyStageSupport: PropTypes.bool,
    previewDocuments: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    gotoMergeResults: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    projections: PropTypes.array.isRequired,
    autocompleteFields: PropTypes.array.isRequired,
    isAtlasDeployed: PropTypes.bool,
  };

  /**
   * What the current CSS opacity for the Stage HTMLElement should be.
   * @returns {Number} The opacity value.
   */
  getOpacity() {
    if (this.props.isEnabled) {
      return 1;
    }
    return DEFAULT_OPACITY;
  }

  renderEditor() {
    return (
      <>
        <DragHandleToolbar
          env={this.props.env}
          isTimeSeries={this.props.isTimeSeries}
          isReadonly={this.props.isReadonly}
          sourceName={this.props.sourceName}
          isExpanded={this.props.isExpanded}
          isEnabled={this.props.isEnabled}
          stageOperator={this.props.stageOperator}
          index={this.props.index}
          stageOperatorSelected={this.props.stageOperatorSelected}
          stageCollapseToggled={this.props.stageCollapseToggled}
          stageToggled={this.props.stageToggled}
          stageAddedAfter={this.props.stageAddedAfter}
          stageDeleted={this.props.stageDeleted}
          serverVersion={this.props.serverVersion}
          isAutoPreviewing={this.props.isAutoPreviewing}
        />
        {this.props.isExpanded && (
          <StageEditor
            stage={this.props.stage}
            stageOperator={this.props.stageOperator}
            error={this.props.error}
            syntaxError={this.props.syntaxError}
            isValid={this.props.isValid}
            index={this.props.index}
            serverVersion={this.props.serverVersion}
            isAutoPreviewing={this.props.isAutoPreviewing}
            stageChanged={this.props.stageChanged}
            fields={this.props.fields}
            projections={this.props.projections}
            autocompleteFields={this.props.autocompleteFields}
          />
        )}
      </>
    );
  }

  renderResizableEditor() {
    const { isAutoPreviewing } = this.props;
    const editor = this.renderEditor();
    if (!isAutoPreviewing) {
      return <div className={styles['stage-editor-no-preview']}>{editor}</div>;
    }
    return (
      <Resizable
        className={styles['stage-editor']}
        defaultSize={{
          width: '388px',
          height: 'auto',
        }}
        minWidth="260px"
        maxWidth="92%"
        enable={resizeableDirections}
        ref={(c) => {
          this.resizableRef = c;
        }}
        handleWrapperClass={styles['stage-resize-handle-wrapper']}
        handleComponent={{
          right: <ResizeHandle />,
        }}
      >
        {editor}
      </Resizable>
    );
  }

  renderPreview() {
    return (
      <div className={styles['stage-preview-container']}>
        <StagePreviewToolbar
          isEnabled={this.props.isEnabled}
          isValid={this.props.isValid}
          stageOperator={this.props.stageOperator}
          stageValue={this.props.stage}
          count={this.props.previewDocuments.length}
          openLink={this.props.openLink}
        />
        {this.props.isExpanded && (
          <StagePreview
            documents={this.props.previewDocuments}
            isValid={this.props.isValid}
            isEnabled={this.props.isEnabled}
            isLoading={this.props.isLoading}
            isComplete={this.props.isComplete}
            isMissingAtlasOnlyStageSupport={this.props.isMissingAtlasOnlyStageSupport}
            error={this.props.error}
            stageOperator={this.props.stageOperator}
            stage={this.props.stage}
            index={this.props.index}
            runOutStage={this.props.runOutStage}
            gotoOutResults={this.props.gotoOutResults}
            gotoMergeResults={this.props.gotoMergeResults}
            isAtlasDeployed={this.props.isAtlasDeployed}
          />
        )}
      </div>
    );
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    const opacity = this.getOpacity();
    return (
      <div
        data-testid="stage-container"
        data-stage-index={this.props.index}
        className={classnames(styles['stage-container'], {
          [styles['stage-container-is-first']]: this.props.index === 0
        })}
      >
        <div className={classnames(styles.stage, {
          [styles['stage-errored']]: this.props.error
        })} style={{ opacity }}>
          {this.renderResizableEditor()}
          {this.props.isAutoPreviewing && this.renderPreview()}
        </div>
      </div>
    );
  }
}

export default connect(
  (state, ownProps) => {
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    return {
      // Derived from stage state
      error: stage.serverError?.message,
      syntaxError: stage.syntaxError?.message,
      isValid: !stage.syntaxError,
      isEnabled: !stage.disabled,
      isExpanded: !stage.collapsed,
      stage: stage.value ?? '',
      stageOperator: stage.stageOperator,
      isLoading: stage.loading,
      isComplete: Boolean(
        !stage.loading && !stage.serverError && stage.previewDocs
      ),
      previewDocuments: stage.previewDocs ?? [],
      // TODO: Derive from isAtlas and serverError
      isMissingAtlasOnlyStageSupport: false,
      autocompleteFields: [],

      // General plugin state
      env: state.env,
      isTimeSeries: state.isTimeSeries,
      isReadonly: state.isReadonly,
      sourceName: state.sourceName,
      index: ownProps.index,
      isAutoPreviewing: state.autoPreview,
      serverVersion: state.serverVersion,
      fields: state.fields,
      projections: state.projections,
      isAtlasDeployed: state.isAtlasDeployed
    };
  },
  {
    runOutStage: () => {},
    gotoOutResults: () => {},
    gotoMergeResults: () => {},
    stageChanged: changeStageValue,
    stageCollapseToggled: changeStageCollapsed,
    stageAddedAfter: addStage,
    stageDeleted: removeStage,
    stageOperatorSelected: changeStageOperator,
    stageToggled: changeStageDisabled,
    openLink: openLink
  }
)(React.memo(Stage));

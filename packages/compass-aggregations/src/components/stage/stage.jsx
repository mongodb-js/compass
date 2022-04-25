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

const DragHandleToolbar = sortableHandle((props) => {
  return <StageEditorToolbar {...props}></StageEditorToolbar>
})

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
    allowWrites: PropTypes.bool.isRequired,
    env: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string,
    stage: PropTypes.string.isRequired,
    stageOperator: PropTypes.string,
    snippet: PropTypes.string,
    error: PropTypes.string,
    syntaxError: PropTypes.string,
    isValid: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isComplete: PropTypes.bool.isRequired,
    // Can be undefined on the initial render
    isMissingAtlasOnlyStageSupport: PropTypes.bool,
    fromStageOperators: PropTypes.bool.isRequired,
    previewDocuments: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    runStage: PropTypes.func.isRequired,
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    gotoMergeResults: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    setIsModified: PropTypes.func.isRequired,
    projections: PropTypes.array.isRequired,
    projectionsChanged: PropTypes.func.isRequired,
    newPipelineFromPaste: PropTypes.func.isRequired
  };

  /* eslint complexity: 0 */
  shouldComponentUpdate(nextProps) {
    const should = (
      nextProps.stageOperator !== this.props.stageOperator ||
      nextProps.snippet !== this.props.snippet ||
      nextProps.error !== this.props.error ||
      nextProps.syntaxError !== this.props.syntaxError ||
      nextProps.isValid !== this.props.isValid ||
      nextProps.isEnabled !== this.props.isEnabled ||
      nextProps.isExpanded !== this.props.isExpanded ||
      nextProps.isLoading !== this.props.isLoading ||
      nextProps.isComplete !== this.props.isComplete ||
      nextProps.isMissingAtlasOnlyStageSupport !== this.props.isMissingAtlasOnlyStageSupport ||
      nextProps.fromStageOperators !== this.props.fromStageOperators ||
      nextProps.index !== this.props.index ||
      nextProps.isCommenting !== this.props.isCommenting ||
      nextProps.isAutoPreviewing !== this.props.isAutoPreviewing ||
      nextProps.serverVersion !== this.props.serverVersion ||
      nextProps.fields.length !== this.props.fields.length ||
      nextProps.projections.length !== this.props.projections.length ||
      (this.props.stageOperator === '$out' &&
        nextProps.stage !== this.props.stage)
    );
    return should;
  }

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
          allowWrites={this.props.allowWrites}
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
          runStage={this.props.runStage}
          isCommenting={this.props.isCommenting}
          stageAddedAfter={this.props.stageAddedAfter}
          stageDeleted={this.props.stageDeleted}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion}
          isAutoPreviewing={this.props.isAutoPreviewing}
        />
        {this.props.isExpanded && (
          <StageEditor
            stage={this.props.stage}
            stageOperator={this.props.stageOperator}
            snippet={this.props.snippet}
            error={this.props.error}
            syntaxError={this.props.syntaxError}
            isValid={this.props.isValid}
            fromStageOperators={this.props.fromStageOperators}
            runStage={this.props.runStage}
            index={this.props.index}
            serverVersion={this.props.serverVersion}
            setIsModified={this.props.setIsModified}
            isAutoPreviewing={this.props.isAutoPreviewing}
            fields={this.props.fields}
            stageChanged={this.props.stageChanged}
            projections={this.props.projections}
            projectionsChanged={this.props.projectionsChanged}
            newPipelineFromPaste={this.props.newPipelineFromPaste}
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
            openLink={this.props.openLink}
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
        data-test-id="stage-container"
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

export default Stage;

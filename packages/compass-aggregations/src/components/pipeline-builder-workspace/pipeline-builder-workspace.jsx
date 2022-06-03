import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Stage from '../stage';
import Input from '../input';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';

import { sortableContainer, sortableElement } from 'react-sortable-hoc';

import styles from './pipeline-builder-workspace.module.less';

const SortableStage = sortableElement(({ idx, ...props }) => {
  return <Stage index={idx} {...props}></Stage>;
});

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

/**
 * The pipeline workspace component.
 */
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
    allowWrites: PropTypes.bool.isRequired,
    editViewName: PropTypes.string,
    env: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string,
    pipeline: PropTypes.array.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    stageAdded: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    inputDocuments: PropTypes.object.isRequired,
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
    fields: PropTypes.array.isRequired,
    isOverviewOn: PropTypes.bool.isRequired,
    projections: PropTypes.array.isRequired,
    projectionsChanged: PropTypes.func.isRequired,
    newPipelineFromPaste: PropTypes.func.isRequired
  };

  /**
   * The stage moved handler.
   *
   * @param {Number} fromIndex - The original index.
   * @param {Number} toIndex - The index to move to.
   */
  onStageMoved = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      this.props.stageMoved(oldIndex, newIndex);
      this.props.runStage(0, true /* force execute */);
    }
  }

  /**
   * Render the modify source banner if neccessary.
   *
   * @returns {Component} The component.
   */
  renderModifyingViewSourceBanner() {
    if (this.props.editViewName) {
      return (<ModifySourceBanner editViewName={this.props.editViewName} />);
    }
  }

  /**
   * Render a stage.
   *
   * @param {Object} stage - The current stage info.
   * @param {Number} i - The current index.
   * @param {Function} connectDragSource - The function to render a stage editor toolbar.
   *
   * @returns {Component} The component.
   */
  renderStage = (stage, i) => {
    return (<SortableStage
      key={stage.id}
      idx={i}
      index={i}
      allowWrites={this.props.allowWrites}
      env={this.props.env}
      isTimeSeries={this.props.isTimeSeries}
      isReadonly={this.props.isReadonly}
      sourceName={this.props.sourceName}
      stage={stage.stage}
      stageOperator={stage.stageOperator}
      error={stage.error}
      syntaxError={stage.syntaxError}
      isValid={stage.isValid}
      isEnabled={stage.isEnabled}
      isLoading={stage.isLoading}
      isComplete={stage.isComplete}
      isMissingAtlasOnlyStageSupport={stage.isMissingAtlasOnlyStageSupport}
      isExpanded={stage.isExpanded}
      isCommenting={this.props.isCommenting}
      isAutoPreviewing={this.props.isAutoPreviewing}
      previewDocuments={stage.previewDocuments}
      runStage={this.props.runStage}
      openLink={this.props.openLink}
      runOutStage={this.props.runOutStage}
      gotoOutResults={this.props.gotoOutResults}
      gotoMergeResults={this.props.gotoMergeResults}
      serverVersion={this.props.serverVersion}
      stageChanged={this.props.stageChanged}
      stageCollapseToggled={this.props.stageCollapseToggled}
      stageAddedAfter={this.props.stageAddedAfter}
      stageDeleted={this.props.stageDeleted}
      stageMoved={this.props.stageMoved}
      stageOperatorSelected={this.props.stageOperatorSelected}
      stageToggled={this.props.stageToggled}
      fields={this.props.fields}
      setIsModified={this.props.setIsModified}
      isOverviewOn={this.props.isOverviewOn}
      projections={this.props.projections}
      projectionsChanged={this.props.projectionsChanged}
      newPipelineFromPaste={this.props.newPipelineFromPaste}
    />);
  }

  /**
   * Render a stage list.
   *
   * @returns {Component} The component.
   */
  renderStageList = () => {
    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.onStageMoved}
        useDragHandle
        transitionDuration={0}
        helperContainer={() => {
          return this.stageListContainerRef ?? document.body
        }}
        helperClass="dragging"
        // Slight distance requirement to prevent sortable logic messing with
        // interactive elements in the handler toolbar component
        distance={10}
      >
        {this.props.pipeline.map((stage, idx) => {
          return this.renderStage(stage, idx);
        })}
      </SortableContainer>
    );
  }

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const inputDocuments = this.props.inputDocuments;
    return (
      <div
        data-testid="pipeline-builder-workspace"
        className={styles['pipeline-workspace-container-container']}
        ref={(ref) => {
          this.stageListContainerRef = ref;
        }}
      >
        <div className={styles['pipeline-workspace-container']}>
          <div className={styles['pipeline-workspace']}>
            {this.renderModifyingViewSourceBanner()}
            <Input
              toggleInputDocumentsCollapsed={
                this.props.toggleInputDocumentsCollapsed
              }
              refreshInputDocuments={this.props.refreshInputDocuments}
              documents={inputDocuments.documents}
              isLoading={inputDocuments.isLoading}
              isExpanded={inputDocuments.isExpanded}
              openLink={this.props.openLink}
              count={inputDocuments.count}
              isOverviewOn={this.props.isOverviewOn}
            />
            {this.renderStageList()}
            <AddStage
              stageAdded={this.props.stageAdded}
              setIsModified={this.props.setIsModified}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default PipelineWorkspace;

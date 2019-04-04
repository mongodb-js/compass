import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { WithDragDropContext } from 'hadron-react-components';
import Stage from 'components/stage';
import Input from 'components/input';
import AddStage from 'components/add-stage';

import styles from './pipeline-workspace.less';

/**
 * The pipeline workspace component.
 */
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
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
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    console.log('PipelineWorkspace#render()', this.props);
    const inputDocuments = this.props.inputDocuments;
    const stages = this.props.pipeline.map((stage, i) => {
      return (
        <Stage
          stage={stage.stage}
          stageOperator={stage.stageOperator}
          snippet={stage.snippet}
          error={stage.error}
          syntaxError={stage.syntaxError}
          isValid={stage.isValid}
          isEnabled={stage.isEnabled}
          isLoading={stage.isLoading}
          isComplete={stage.isComplete}
          isExpanded={stage.isExpanded}
          isCommenting={this.props.isCommenting}
          isAutoPreviewing={this.props.isAutoPreviewing}
          fromStageOperators={stage.fromStageOperators || false}
          previewDocuments={stage.previewDocuments}
          runStage={this.props.runStage}
          index={i}
          openLink={this.props.openLink}
          runOutStage={this.props.runOutStage}
          gotoOutResults={this.props.gotoOutResults}
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
          key={stage.id}
          isOverviewOn={this.props.isOverviewOn}
          projections={this.props.projections}
          projectionsChanged={this.props.projectionsChanged}
          newPipelineFromPaste={this.props.newPipelineFromPaste}
        />
      );
    });
    return (
      <div className={classnames(styles['pipeline-workspace'])}>
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
        {stages}
        <AddStage
          stageAdded={this.props.stageAdded}
          setIsModified={this.props.setIsModified}
        />
      </div>
    );
  }
}

export default WithDragDropContext(PipelineWorkspace);

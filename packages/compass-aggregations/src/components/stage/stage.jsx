/* eslint no-unused-vars: 0 */
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageToolbar from 'components/stage-toolbar';
import StageWorkspace from 'components/stage-workspace';

import styles from './stage.less';

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

  /**
   * Render the workspace.
   *
   * @returns {React.Component} The workspace.
   */
  renderWorkspace() {
    if (this.props.isExpanded) {
      return (
        <StageWorkspace
          stage={this.props.stage}
          stageOperator={this.props.stageOperator}
          snippet={this.props.snippet}
          error={this.props.error}
          syntaxError={this.props.syntaxError}
          isValid={this.props.isValid}
          isEnabled={this.props.isEnabled}
          isLoading={this.props.isLoading}
          isComplete={this.props.isComplete}
          fromStageOperators={this.props.fromStageOperators}
          previewDocuments={this.props.previewDocuments}
          runStage={this.props.runStage}
          runOutStage={this.props.runOutStage}
          gotoOutResults={this.props.gotoOutResults}
          gotoMergeResults={this.props.gotoMergeResults}
          index={this.props.index}
          isAutoPreviewing={this.props.isAutoPreviewing}
          serverVersion={this.props.serverVersion}
          fields={this.props.fields}
          setIsModified={this.props.setIsModified}
          stageChanged={this.props.stageChanged}
          projections={this.props.projections}
          projectionsChanged={this.props.projectionsChanged}
          newPipelineFromPaste={this.props.newPipelineFromPaste}
        />
      );
    }
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    const opacity = this.getOpacity();
    const errored = this.props.error ? 'stage-errored' : 'stage';
    return (
      <div className={classnames(styles[errored])} style={{ opacity }}>
        <StageToolbar
          allowWrites={this.props.allowWrites}
          stage={this.props.stage}
          stageOperator={this.props.stageOperator}
          error={this.props.error}
          isExpanded={this.props.isExpanded}
          isEnabled={this.props.isEnabled}
          isValid={this.props.isValid}
          previewCount={this.props.previewDocuments.length}
          index={this.props.index}
          serverVersion={this.props.serverVersion}
          stageOperatorSelected={this.props.stageOperatorSelected}
          stageToggled={this.props.stageToggled}
          openLink={this.props.openLink}
          stageAddedAfter={this.props.stageAddedAfter}
          stageDeleted={this.props.stageDeleted}
          runStage={this.props.runStage}
          isCommenting={this.props.isCommenting}
          setIsModified={this.props.setIsModified}
          stageCollapseToggled={this.props.stageCollapseToggled}
        />
        {this.renderWorkspace()}
      </div>
    );
  }
}

export default Stage;

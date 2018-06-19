import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Pipeline from 'components/pipeline';
import { namespaceChanged } from 'modules/namespace';
import { nameChanged } from 'modules/name';
import { toggleComments } from 'modules/comments';
import { toggleSample } from 'modules/sample';
import {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments
} from 'modules/input-documents';

import { exportToLanguage } from 'modules/export-to-language';
import { openLink } from 'modules/link';
import {
  deletePipeline,
  newPipeline,
  clonePipeline
} from 'modules';
import {
  runStage,
  runOutStage,
  gotoOutResults,
  stageAdded,
  stageAddedAfter,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stageToggled
} from 'modules/pipeline';
import {
  savedPipelinesListToggle,
  saveCurrentPipeline,
  savedPipelineAdd,
  getSavedPipelines
} from 'modules/saved-pipeline';
import { setIsModified } from 'modules/is-modified';
import { restoreSavedPipeline, getPipelineFromIndexedDB } from 'modules/index';
import { restorePipelineModalToggle, restorePipelineFrom } from 'modules/restore-pipeline';
import styles from './aggregations.less';

/**
 * The core aggregations component.
 */
class Aggregations extends Component {
  static displayName = 'AggregationsComponent';

  /**
   * Render Aggregations component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.aggregations)}>
        <Pipeline {...this.props} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  fields: state.fields,
  inputDocuments: state.inputDocuments,
  namespace: state.namespace,
  serverVersion: state.serverVersion,
  pipeline: state.pipeline,
  savedPipeline: state.savedPipeline,
  restorePipeline: state.restorePipeline,
  name: state.name,
  isModified: state.isModified,
  isCommenting: state.comments,
  isSampling: state.sample
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAggregations = connect(
  mapStateToProps,
  {
    namespaceChanged,
    nameChanged,
    toggleInputDocumentsCollapsed,
    refreshInputDocuments,
    toggleComments,
    toggleSample,
    deletePipeline,
    runStage,
    runOutStage,
    gotoOutResults,
    stageAdded,
    stageAddedAfter,
    stageChanged,
    stageCollapseToggled,
    stageDeleted,
    stageMoved,
    stageOperatorSelected,
    stageToggled,
    exportToLanguage,
    savedPipelinesListToggle,
    saveCurrentPipeline,
    savedPipelineAdd,
    getSavedPipelines,
    restorePipelineModalToggle,
    restorePipelineFrom,
    restoreSavedPipeline,
    newPipeline,
    clonePipeline,
    openLink,
    getPipelineFromIndexedDB,
    setIsModified
  },
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import OffCanvas from 'components/off-canvas';
import Pipeline from 'components/pipeline';
import { namespaceChanged } from 'modules/namespace';
import { nameChanged } from 'modules/name';
import {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments
} from 'modules/input-documents';

import { copyToClipboard } from 'modules/clipboard';
import {
  deletePipeline,
  newPipeline,
  clonePipeline
} from 'modules';
import {
  runStage,
  stageAdded,
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
        <OffCanvas {...this.props} />
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
  name: state.name
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
    deletePipeline,
    runStage,
    stageAdded,
    stageChanged,
    stageCollapseToggled,
    stageDeleted,
    stageMoved,
    stageOperatorSelected,
    stageToggled,
    copyToClipboard,
    savedPipelinesListToggle,
    saveCurrentPipeline,
    savedPipelineAdd,
    getSavedPipelines,
    restorePipelineModalToggle,
    restorePipelineFrom,
    restoreSavedPipeline,
    newPipeline,
    clonePipeline,
    getPipelineFromIndexedDB
  },
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

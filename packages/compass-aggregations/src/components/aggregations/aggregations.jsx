import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import OffCanvas from 'components/off-canvas';
import Pipeline from 'components/pipeline';
import { namespaceChanged } from 'modules/namespace';
import {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments
} from 'modules/input-documents';

import { viewChanged } from 'modules/view';
import { copyToClipboard } from 'modules/clipboard';
import { deletePipeline } from 'modules';
import {
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
  savePipelineModalToggle,
  saveModalErrorToggle,
  saveCurrentPipeline,
  savedPipelineAdd,
  getSavedPipelines
} from 'modules/saved-pipeline';

import { restoreSavedPipeline, getPipelineFromIndexedDB } from 'modules/index';
import { restorePipelineModalToggle, restorePipelineObjectID } from 'modules/restore-pipeline';
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
  view: state.view,
  savedPipeline: state.savedPipeline,
  restorePipeline: state.restorePipeline
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAggregations = connect(
  mapStateToProps,
  {
    namespaceChanged,
    toggleInputDocumentsCollapsed,
    refreshInputDocuments,
    deletePipeline,
    stageAdded,
    stageChanged,
    stageCollapseToggled,
    stageDeleted,
    stageMoved,
    stageOperatorSelected,
    stageToggled,
    viewChanged,
    copyToClipboard,
    savedPipelinesListToggle,
    savePipelineModalToggle,
    saveModalErrorToggle,
    saveCurrentPipeline,
    savedPipelineAdd,
    getSavedPipelines,
    restorePipelineModalToggle,
    restorePipelineObjectID,
    restoreSavedPipeline,
    getPipelineFromIndexedDB
  },
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

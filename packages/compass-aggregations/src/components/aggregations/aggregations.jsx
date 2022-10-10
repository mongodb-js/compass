import React, { Component } from 'react';
import { connect } from 'react-redux';
import Pipeline from '../pipeline';
import { maxTimeMSChanged } from '../../modules/max-time-ms';
import { collationStringChanged } from '../../modules/collation-string';
import { toggleAutoPreview } from '../../modules/auto-preview';
import {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments
} from '../../modules/input-documents';
import { exportToLanguage } from '../../modules/export-to-language';
import { openLink } from '../../modules/link';
import { clonePipeline } from "../../modules/clone-pipeline";
import {
  runStage,
  runOutStage,
  gotoOutResults,
  gotoMergeResults,
  stageAdded,
  stageAddedAfter,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stageToggled
} from '../../modules/pipeline';
import {
  saveCurrentPipeline,
  savedPipelineAdd,
  getSavedPipelines,
} from '../../modules/saved-pipeline';
import { setIsModified } from '../../modules/is-modified';
import {
  newPipeline,
  newPipelineFromText,
  closeImport,
  changeText,
  createNew,
  confirmNew
} from '../../modules/import-pipeline';
import { setIsNewPipelineConfirm } from '../../modules/is-new-pipeline-confirm';
import {
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  applySettings
} from '../../modules/settings';
import {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen
} from '../../modules/saving-pipeline';
import { projectionsChanged } from '../../modules/projections';
import {
  dismissViewError,
  updateView
} from '../../modules/update-view';

import styles from './aggregations.module.less';

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
      <div className={styles.aggregations}>
        <Pipeline {...this.props} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {import('../../modules').RootState} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  fields: state.fields,
  inputDocuments: state.inputDocuments,
  namespace: state.namespace,
  env: state.env,
  isTimeSeries: state.isTimeSeries,
  isReadonly: state.isReadonly,
  sourceName: state.sourceName,
  serverVersion: state.serverVersion,
  pipeline: state.pipeline,
  name: state.name,
  collationString: state.collationString,
  isModified: state.isModified,
  isCommenting: state.comments,
  isAtlasDeployed: state.isAtlasDeployed,
  isAutoPreviewing: state.autoPreview,
  isImportPipelineOpen: state.importPipeline.isOpen,
  isImportConfirmationNeeded: state.importPipeline.isConfirmationNeeded,
  importPipelineText: state.importPipeline.text,
  importPipelineError: state.importPipeline.syntaxError,
  settings: state.settings,
  limit: state.limit,
  largeLimit: state.largeLimit,
  maxTimeMS: state.maxTimeMS,
  savingPipeline: state.savingPipeline,
  projections: state.projections,
  editViewName: state.editViewName,
  isNewPipelineConfirm: state.isNewPipelineConfirm,
  setIsNewPipelineConfirm: state.setIsNewPipelineConfirm,
  updateViewError: state.updateViewError,
  workspace: state.workspace,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAggregations = connect(
  mapStateToProps,
  {
    collationStringChanged,
    toggleInputDocumentsCollapsed,
    refreshInputDocuments,
    toggleAutoPreview,
    runStage,
    runOutStage,
    gotoOutResults,
    gotoMergeResults,
    stageAdded,
    stageAddedAfter,
    stageChanged,
    stageCollapseToggled,
    stageDeleted,
    stageMoved,
    stageOperatorSelected,
    stageToggled,
    toggleSettingsIsExpanded,
    toggleSettingsIsCommentMode,
    setSettingsSampleSize,
    setSettingsLimit,
    exportToLanguage,
    saveCurrentPipeline,
    savedPipelineAdd,
    getSavedPipelines,
    newPipeline,
    newPipelineFromText,
    closeImport,
    clonePipeline,
    changeText,
    createNew,
    confirmNew,
    openLink,
    applySettings,
    setIsModified,
    maxTimeMSChanged,
    savingPipelineNameChanged,
    savingPipelineApply,
    savingPipelineCancel,
    savingPipelineOpen,
    projectionsChanged,
    updateView,
    setIsNewPipelineConfirm,
    dismissViewError
  }
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

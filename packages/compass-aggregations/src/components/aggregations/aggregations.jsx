import React, { Component } from 'react';
import { connect } from 'react-redux';
import Pipeline from '../pipeline';
import { namespaceChanged } from '../../modules/namespace';
import { nameChanged } from '../../modules/name';
import { limitChanged } from '../../modules/limit';
import { largeLimitChanged } from '../../modules/large-limit';
import { maxTimeMSChanged } from '../../modules/max-time-ms';
import { collationCollapseToggled } from '../../modules/collation-collapser';
import { collationChanged } from '../../modules/collation';
import { collationStringChanged } from '../../modules/collation-string';
import { toggleComments } from '../../modules/comments';
import { toggleSample } from '../../modules/sample';
import { toggleAutoPreview } from '../../modules/auto-preview';
import {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments
} from '../../modules/input-documents';
import { exportToLanguage } from '../../modules/export-to-language';
import { openLink } from '../../modules/link';
import { toggleOverview } from '../../modules/is-overview-on';
import { toggleFullscreen } from '../../modules/is-fullscreen-on';
import {
  deletePipeline,
  newPipeline,
  clonePipeline,
  openCreateView
} from '../../modules';
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
  savedPipelinesListToggle,
  saveCurrentPipeline,
  savedPipelineAdd,
  getSavedPipelines
} from '../../modules/saved-pipeline';
import { setIsModified } from '../../modules/is-modified';
import {
  newPipelineFromPaste,
  restoreSavedPipeline,
  getPipelineFromIndexedDB
} from '../../modules/index';
import {
  restorePipelineModalToggle,
  restorePipelineFrom
} from '../../modules/restore-pipeline';
import {
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
  setSettingsMaxTimeMS,
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
  allowWrites: state.allowWrites,
  fields: state.fields,
  inputDocuments: state.inputDocuments,
  namespace: state.namespace,
  env: state.env,
  isTimeSeries: state.isTimeSeries,
  isReadonly: state.isReadonly,
  sourceName: state.sourceName,
  serverVersion: state.serverVersion,
  pipeline: state.pipeline,
  savedPipeline: state.savedPipeline,
  restorePipeline: state.restorePipeline,
  name: state.name,
  isCollationExpanded: state.isCollationExpanded,
  collation: state.collation,
  collationString: state.collationString,
  isModified: state.isModified,
  isCommenting: state.comments,
  isSampling: state.sample,
  isAtlasDeployed: state.isAtlasDeployed,
  isAutoPreviewing: state.autoPreview,
  isImportPipelineOpen: state.importPipeline.isOpen,
  isImportConfirmationNeeded: state.importPipeline.isConfirmationNeeded,
  importPipelineText: state.importPipeline.text,
  importPipelineError: state.importPipeline.syntaxError,
  settings: state.settings,
  isOverviewOn: state.isOverviewOn,
  limit: state.limit,
  largeLimit: state.largeLimit,
  maxTimeMS: state.maxTimeMS,
  isFullscreenOn: state.isFullscreenOn,
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
    namespaceChanged,
    nameChanged,
    collationChanged,
    collationStringChanged,
    toggleInputDocumentsCollapsed,
    refreshInputDocuments,
    toggleOverview,
    toggleComments,
    toggleSample,
    toggleAutoPreview,
    deletePipeline,
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
    collationCollapseToggled,
    toggleSettingsIsExpanded,
    toggleSettingsIsCommentMode,
    setSettingsSampleSize,
    setSettingsMaxTimeMS,
    setSettingsLimit,
    exportToLanguage,
    savedPipelinesListToggle,
    saveCurrentPipeline,
    savedPipelineAdd,
    getSavedPipelines,
    restorePipelineModalToggle,
    restorePipelineFrom,
    restoreSavedPipeline,
    newPipeline,
    newPipelineFromText,
    closeImport,
    clonePipeline,
    changeText,
    createNew,
    confirmNew,
    openLink,
    getPipelineFromIndexedDB,
    applySettings,
    setIsModified,
    limitChanged,
    largeLimitChanged,
    maxTimeMSChanged,
    toggleFullscreen,
    savingPipelineNameChanged,
    savingPipelineApply,
    savingPipelineCancel,
    savingPipelineOpen,
    projectionsChanged,
    newPipelineFromPaste,
    updateView,
    openCreateView,
    setIsNewPipelineConfirm,
    dismissViewError
  }
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

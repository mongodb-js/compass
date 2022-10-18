import React, { Component } from 'react';
import { connect } from 'react-redux';
import Pipeline from '../pipeline';
import { maxTimeMSChanged } from '../../modules/max-time-ms';
import { collationStringChanged } from '../../modules/collation-string';
import { toggleAutoPreview } from '../../modules/auto-preview';
import { exportToLanguage } from '../../modules/export-to-language';
import { openLink } from '../../modules/link';
import { clonePipeline } from "../../modules/clone-pipeline";
import { runOutStage } from '../../modules/pipeline';
import {
  saveCurrentPipeline,
  savedPipelineAdd,
  getSavedPipelines,
} from '../../modules/saved-pipeline';
import {
  newPipeline,
  newPipelineFromText,
  closeImport,
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
  namespace: state.namespace,
  name: state.name,
  collationString: state.collationString,
  isCommenting: state.comments,
  isAtlasDeployed: state.isAtlasDeployed,
  isAutoPreviewing: state.autoPreview,
  isImportConfirmationNeeded: state.importPipeline.isConfirmationNeeded,
  settings: state.settings,
  limit: state.limit,
  largeLimit: state.largeLimit,
  maxTimeMS: state.maxTimeMS,
  savingPipeline: state.savingPipeline,
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
    toggleAutoPreview,
    runOutStage,
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
    confirmNew,
    openLink,
    applySettings,
    maxTimeMSChanged,
    savingPipelineNameChanged,
    savingPipelineApply,
    savingPipelineCancel,
    savingPipelineOpen,
    updateView,
    setIsNewPipelineConfirm,
    dismissViewError
  }
)(Aggregations);

export default MappedAggregations;
export { Aggregations };

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Pipeline from '../pipeline';
import { clonePipeline } from '../../modules/clone-pipeline';
import { saveCurrentPipeline } from '../../modules/saved-pipeline';
import {
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  applySettings,
} from '../../modules/settings';
import {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
} from '../../modules/saving-pipeline';
import { dismissViewError } from '../../modules/update-view';

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
  settings: state.settings,
  limit: state.limit,
  largeLimit: state.largeLimit,
  maxTimeMS: state.maxTimeMS,
  savingPipeline: state.savingPipeline,
  updateViewError: state.updateViewError,
  workspace: state.workspace,
  isStageCreatorOpen: state.stageCreator.isPanelOpen,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAggregations = connect(mapStateToProps, {
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  saveCurrentPipeline,
  clonePipeline,
  applySettings,
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
  dismissViewError,
})(Aggregations);

export default MappedAggregations;
export { Aggregations };
